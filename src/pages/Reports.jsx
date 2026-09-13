import { useEffect, useState } from "react";
import API from "../api/axios";
import { useToast } from "../components/ToastContext";
import Spinner from "../components/Spinner";
import "../styles/reports.css";

const Reports = () => {
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [range, setRange] = useState("daily");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await API.get("/sales");
        setSales(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterByRange = () => {
    const now = new Date();
    return sales.filter((s) => {
      const d = new Date(s.saleDate);
      if (range === "daily") return d.toDateString() === now.toDateString();
      if (range === "weekly") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (range === "monthly") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return d >= monthAgo;
      }
      if (range === "yearly") {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return d >= yearAgo;
      }
      return true;
    });
  };

  const filtered = filterByRange();
  const totalRevenue = filtered.reduce((a, s) => a + s.totalAmount, 0);
  const totalQty = filtered.reduce((a, s) => a + s.quantitySold, 0);

  const handlePrint = () => {
    toast.info("Opening print dialog...");
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <button className="primary-btn" onClick={handlePrint}>
          🖨️ Export / Print PDF
        </button>
      </div>

      <div className="range-tabs">
        {["daily", "weekly", "monthly", "yearly"].map((r) => (
          <button
            key={r}
            className={`range-tab ${range === r ? "active" : ""}`}
            onClick={() => setRange(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <p>Total Transactions</p>
          <h4>{filtered.length}</h4>
        </div>
        <div className="summary-card">
          <p>Total Quantity Sold</p>
          <h4>{totalQty}</h4>
        </div>
        <div className="summary-card">
          <p>Total Revenue</p>
          <h4>₦{totalRevenue.toLocaleString()}</h4>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total (₦)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">
                  <div className="page-loading-full">
                    <Spinner size={28} color="#3b82f6" />
                    <span>Loading reports...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No data for this range
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id}>
                  <td>{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td>{s.productId?.name || "Deleted"}</td>
                  <td>{s.quantitySold}</td>
                  <td>{s.totalAmount?.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
