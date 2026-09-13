import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../styles/forecast.css";

const Forecast = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [lr, setLr] = useState(null);
  const [rf, setRf] = useState(null);
  const [bestModel, setBestModel] = useState("");
  const [insights, setInsights] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = selectedProduct ? { productId: selectedProduct } : {};
        const res = await API.get("/forecast/history", { params });
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [selectedProduct]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await API.get("/forecast/inventory");
        setInventory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInventory();
  }, []);

  const generateForecast = async () => {
    setLoading(true);
    setError("");
    try {
      const body = { periods: 6 };
      if (selectedProduct) body.productId = selectedProduct;
      const res = await API.post("/forecast/generate", body);
      setHistory(res.data.history);
      setPredictions(res.data.predictions);
      setMetrics(res.data.metrics);
      setLr(res.data.linearRegression);
      setRf(res.data.randomForest);
      setBestModel(res.data.bestModel);
      setInsights(res.data.insights);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!predictions.length || !metrics) return;
    const doc = new jsPDF();
    const productLabel = selectedProduct
      ? products.find((p) => p._id === selectedProduct)?.name || "Product"
      : "All Products";

    doc.setFontSize(18);
    doc.text("Sales Forecast Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Scope: ${productLabel}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(
      `Best model: ${bestModel === "randomForest" ? "Random Forest" : "Linear Regression"}`,
      14,
      40,
    );

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Summary", 14, 52);
    doc.setFontSize(10);
    const summaryText = doc.splitTextToSize(insights?.summary || "", 180);
    doc.text(summaryText, 14, 58);

    const afterSummary = 58 + summaryText.length * 5 + 6;

    autoTable(doc, {
      startY: afterSummary,
      head: [["Month", "Predicted Sales"]],
      body: predictions.map((p) => [p.label, p.predicted]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    const afterForecast = doc.lastAutoTable.finalY + 10;

    autoTable(doc, {
      startY: afterForecast,
      head: [["Model", "Test Set", "MAE", "MSE", "R²"]],
      body: [
        [
          "Linear Regression",
          "In-sample",
          lr.insample.mae.toFixed(2),
          lr.insample.mse.toFixed(2),
          lr.insample.r2.toFixed(4),
        ],
        [
          "Linear Regression",
          "Holdout",
          lr.holdout.mae.toFixed(2),
          lr.holdout.mse.toFixed(2),
          lr.holdout.r2.toFixed(4),
        ],
        [
          "Random Forest",
          "In-sample",
          rf.insample.mae.toFixed(2),
          rf.insample.mse.toFixed(2),
          rf.insample.r2.toFixed(4),
        ],
        [
          "Random Forest",
          "Holdout",
          rf.holdout.mae.toFixed(2),
          rf.holdout.mse.toFixed(2),
          rf.holdout.r2.toFixed(4),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`forecast-${productLabel.replace(/\s+/g, "-")}.pdf`);
  };

  const combinedData = [
    ...history.map((h) => ({
      label: h.label,
      actual: h.sales,
      predicted: null,
    })),
    ...predictions.map((p) => ({
      label: p.label,
      actual: null,
      predicted: p.predicted,
    })),
  ];

  const modelName = (key) =>
    key === "randomForest" ? "Random Forest" : "Linear Regression";

  const statusLabel = (s) =>
    ({
      restock: "Restock needed",
      watch: "Watch",
      ok: "Sufficient",
      "insufficient-data": "No data",
    })[s] || s;

  return (
    <div className="forecast-page">
      <div className="page-header">
        <h1 className="page-title">AI Sales Forecasting</h1>
        <div className="header-actions">
          {user?.role === "admin" && (
            <button
              className="primary-btn"
              onClick={generateForecast}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Forecast"}
            </button>
          )}
          {predictions.length > 0 && (
            <button className="secondary-btn" onClick={downloadPdf}>
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="product-selector">
        <label>Forecast Scope</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">All Products (combined)</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chart-box">
        <h3>Historical vs Forecasted Sales</h3>
        {combinedData.length === 0 ? (
          <p className="empty-text">No data yet. Record sales first.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Actual Sales"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#ef4444"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Predicted Sales"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {insights && (
        <div className="chart-box">
          <h3>In Plain Words</h3>
          <p className="plain-summary">{insights.summary}</p>
          <div className="insights-grid">
            <div className="insight-card">
              <p className="insight-label">Trend</p>
              <h4>{insights.trend}</h4>
            </div>
            <div className="insight-card">
              <p className="insight-label">Expected change</p>
              <h4>
                {insights.growthRate > 0 ? "+" : ""}
                {insights.growthRate}%
              </h4>
            </div>
            <div className="insight-card wide">
              <p className="insight-label">Recommendation</p>
              <h4>{insights.recommendation}</h4>
            </div>
          </div>
        </div>
      )}

      {inventory.length > 0 && (
        <div className="chart-box">
          <h3>Inventory Recommendations</h3>
          <p className="plain-summary">
            Each row compares next month&apos;s expected demand for a product
            with how much stock you currently have. If demand is higher than
            stock, the system recommends how much to restock.
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Forecasted Demand</th>
                  <th>Restock</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.name}</td>
                    <td>{row.currentStock}</td>
                    <td>{row.forecastedDemand ?? "—"}</td>
                    <td>{row.recommendedRestock ?? "—"}</td>
                    <td>
                      <span className={`status-pill status-${row.status}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <>
          <div className="chart-box">
            <h3>Forecast Table</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Predicted Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <tr key={i}>
                      <td>{p.label}</td>
                      <td>{p.predicted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {lr && rf && (
            <div className="chart-box">
              <h3>
                Model Comparison — Winner:{" "}
                <span
                  style={{
                    color: bestModel === "randomForest" ? "#ef4444" : "#10b981",
                  }}
                >
                  {modelName(bestModel)}
                </span>
              </h3>
              <p className="plain-summary">
                Two forecasting models were trained and tested on unseen data.
                The winner is the one that predicts the past six months most
                accurately. A Random Forest only wins if it beats Linear
                Regression by at least 10%, because Linear Regression is better
                at extending trends into the future.
              </p>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Test Set</th>
                      <th>MAE</th>
                      <th>MSE</th>
                      <th>R²</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowSpan="2">Linear Regression</td>
                      <td>In-sample (36 mo)</td>
                      <td>{lr.insample.mae.toFixed(2)}</td>
                      <td>{lr.insample.mse.toFixed(2)}</td>
                      <td>{lr.insample.r2.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td>Holdout (last 6 mo)</td>
                      <td>{lr.holdout.mae.toFixed(2)}</td>
                      <td>{lr.holdout.mse.toFixed(2)}</td>
                      <td>{lr.holdout.r2.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td rowSpan="2">Random Forest</td>
                      <td>In-sample (36 mo)</td>
                      <td>{rf.insample.mae.toFixed(2)}</td>
                      <td>{rf.insample.mse.toFixed(2)}</td>
                      <td>{rf.insample.r2.toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td>Holdout (last 6 mo)</td>
                      <td>{rf.holdout.mae.toFixed(2)}</td>
                      <td>{rf.holdout.mse.toFixed(2)}</td>
                      <td>{rf.holdout.r2.toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {metrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <p>MAE</p>
                <h4>{metrics.mae.toFixed(2)}</h4>
                <span className="metric-help">
                  Average prediction error (lower is better)
                </span>
              </div>
              <div className="metric-card">
                <p>MSE</p>
                <h4>{metrics.mse.toFixed(2)}</h4>
                <span className="metric-help">
                  Penalizes large errors more than MAE
                </span>
              </div>
              <div className="metric-card">
                <p>R² Score</p>
                <h4>{metrics.r2.toFixed(4)}</h4>
                <span className="metric-help">
                  How well the line fits (1.0 = perfect)
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Forecast;
