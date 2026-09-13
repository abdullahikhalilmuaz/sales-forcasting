import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastContext";
import Spinner from "../components/Spinner";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/sales.css";

const Sales = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    productId: "",
    quantitySold: "",
    saleDate: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([
        API.get("/sales"),
        API.get("/products"),
      ]);
      setSales(s.data);
      setProducts(p.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await API.post("/sales", {
        productId: form.productId,
        quantitySold: Number(form.quantitySold),
        saleDate: form.saleDate,
      });
      toast.success("Sale recorded successfully");
      setForm({
        productId: "",
        quantitySold: "",
        saleDate: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record sale";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    setDeletingId(id);
    try {
      await API.delete(`/sales/${id}`);
      toast.success("Sale deleted");
      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
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
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn btn-with-spinner"
                disabled={saving}
              >
                {saving && <Spinner size={14} />}
                {saving ? "Saving..." : "Save"}
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
            {loading ? (
              <tr>
                <td colSpan="6">
                  <div className="page-loading-full">
                    <Spinner size={28} color="#3b82f6" />
                    <span>Loading sales...</span>
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
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
                        onClick={() => setConfirmDelete(s)}
                        disabled={deletingId === s._id}
                      >
                        {deletingId === s._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete sale?"
        message={
          confirmDelete
            ? `Delete the sale of ${confirmDelete.quantitySold} × ${confirmDelete.productId?.name || "product"} on ${new Date(confirmDelete.saleDate).toLocaleDateString()}?`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deletingId === confirmDelete?._id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Sales;
