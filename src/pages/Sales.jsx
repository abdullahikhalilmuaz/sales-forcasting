import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/sales.css";

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    quantitySold: "",
    saleDate: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([
        API.get("/sales"),
        API.get("/products"),
      ]);
      setSales(s.data);
      setProducts(p.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.post("/sales", {
        productId: form.productId,
        quantitySold: Number(form.quantitySold),
        saleDate: form.saleDate,
      });
      setForm({
        productId: "",
        quantitySold: "",
        saleDate: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record sale");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sale?")) return;
    try {
      await API.delete(`/sales/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1 className="page-title">Sales Records</h1>
        <button className="primary-btn" onClick={() => setShowForm(true)}>
          + Record Sale
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h3>Record Sale</h3>
            {error && <div className="error-msg">{error}</div>}

            <label>Product</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₦{p.unitPrice}
                </option>
              ))}
            </select>

            <label>Quantity Sold</label>
            <input
              type="number"
              min="1"
              value={form.quantitySold}
              onChange={(e) =>
                setForm({ ...form, quantitySold: e.target.value })
              }
              required
            />

            <label>Sale Date</label>
            <input
              type="date"
              value={form.saleDate}
              onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
              required
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Recorded By</th>
              {user?.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No sales recorded yet
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s._id}>
                  <td>{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td>{s.productId?.name || "Deleted"}</td>
                  <td>{s.quantitySold}</td>
                  <td>₦{s.totalAmount?.toLocaleString()}</td>
                  <td>{s.recordedBy?.name || "Unknown"}</td>
                  {user?.role === "admin" && (
                    <td>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(s._id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
