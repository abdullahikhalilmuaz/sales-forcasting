import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "../styles/product.css";

const Products = () => {
  const { user } = useAuth();
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

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
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
    try {
      const payload = {
        name: form.name,
        category: form.category || "General",
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock) || 0,
      };
      if (editing) {
        await API.put(`/products/${editing}`, payload);
      } else {
        await API.post("/products", payload);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
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
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                {editing ? "Update" : "Add"}
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
            {filtered.length === 0 ? (
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
                        onClick={() => handleDelete(p._id)}
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

export default Products;
