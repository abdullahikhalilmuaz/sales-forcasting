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
import "../styles/forecast.css";

const Forecast = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get("/forecast/history");
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  const generateForecast = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/forecast/generate", { periods: 3 });
      setHistory(res.data.history);
      setPredictions(res.data.predictions);
      setMetrics(res.data.metrics);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate forecast");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="forecast-page">
      <div className="page-header">
        <h1 className="page-title">AI Sales Forecasting</h1>
        {user?.role === "admin" && (
          <button
            className="primary-btn"
            onClick={generateForecast}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Forecast"}
          </button>
        )}
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

          {metrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <p>MAE</p>
                <h4>{metrics.mae.toFixed(2)}</h4>
              </div>
              <div className="metric-card">
                <p>MSE</p>
                <h4>{metrics.mse.toFixed(2)}</h4>
              </div>
              <div className="metric-card">
                <p>R² Score</p>
                <h4>{metrics.r2.toFixed(4)}</h4>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Forecast;
