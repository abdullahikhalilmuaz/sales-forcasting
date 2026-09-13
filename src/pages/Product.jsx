import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastContext";
import Spinner from "../components/Spinner";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/product.css";

const Products = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    unitPrice: "",
    stock: "",
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: "", category: "", unitPrice: "", stock: "" });
    setEditing(null);
    setError("");
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category || "General",
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock) || 0,
      };
      if (editing) {
        await API.put(`/products/${editing}`, payload);
        toast.success(`"${payload.name}" updated`);
      } else {
        await API.post("/products", payload);
        toast.success(`"${payload.name}" added`);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name,
      category: p.category,
      unitPrice: p.unitPrice,
      stock: p.stock,
    });
    setShowForm(true);
  };

  const confirmDeleteProduct = (p) => {
    setConfirmDelete(p);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    setDeletingId(id);
    try {
      await API.delete(`/products/${id}`);
      toast.success(`"${confirmDelete.name}" deleted`);
      setConfirmDelete(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="products-page">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        {user?.role === "admin" && (
          <button
            className="primary-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        )}
      </div>

      <input
        className="search-input"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && user?.role === "admin" && (
        <div className="modal-overlay" onClick={resetForm}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h3>{editing ? "Edit Product" : "Add Product"}</h3>
            {error && <div className="error-msg">{error}</div>}

            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <label>Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />

            <label>Unit Price (₦)</label>
            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              required
              min="0"
            />

            <label>Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              min="0"
            />

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
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
                {saving ? "Saving..." : editing ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              {user?.role === "admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">
                  <div className="page-loading-full">
                    <Spinner size={28} color="#3b82f6" />
                    <span>Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₦{p.unitPrice.toLocaleString()}</td>
                  <td>{p.stock}</td>
                  {user?.role === "admin" && (
                    <td>
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => confirmDeleteProduct(p)}
                        disabled={deletingId === p._id}
                      >
                        {deletingId === p._id ? "Deleting..." : "Delete"}
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
        title="Delete product?"
        message={
          confirmDelete
            ? `This will permanently remove "${confirmDelete.name}" from the catalog. Sales history for this product will remain but show as "Deleted".`
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

export default Products;
