import { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertContainer } from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import './Products.css';

const emptyForm = { name: '', sku: '', price: '', quantity: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const addAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      addAlert('Could not load products', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setErrors({});
    setModalOpen(true);
  }

  function validateForm() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.sku.trim()) newErrors.sku = 'SKU is required';

    const price = parseFloat(form.price);
    if (!form.price || isNaN(price)) newErrors.price = 'Valid price is required';
    else if (price <= 0) newErrors.price = 'Price must be greater than 0';

    const qty = parseInt(form.quantity, 10);
    if (form.quantity === '' || isNaN(qty)) newErrors.quantity = 'Valid quantity is required';
    else if (qty < 0) newErrors.quantity = 'Quantity cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
    };

    try {
      if (editing) {
        await productAPI.update(editing.id, payload);
        addAlert('Product updated successfully');
      } else {
        await productAPI.create(payload);
        addAlert('Product created successfully');
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      addAlert(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await productAPI.delete(confirmDelete.id);
      addAlert('Product deleted');
      loadProducts();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete product';
      addAlert(msg, 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleInputChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // filter by name or sku
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product inventory</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          + Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">⬡</span>
          <p className="empty-text">
            {searchTerm ? 'No products match your search' : 'No products yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td className="cell-name">{product.name}</td>
                  <td><span className="badge badge--neutral">{product.sku}</span></td>
                  <td className="cell-price">${product.price.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        product.quantity === 0
                          ? 'badge--danger'
                          : product.quantity < 10
                          ? 'badge--warning'
                          : 'badge--success'
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => openEditModal(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--ghost btn--sm btn-delete"
                        onClick={() => setConfirmDelete(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              type="text"
              placeholder="e.g. Wireless Mouse"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Code</label>
            <input
              className={`form-input ${errors.sku ? 'form-input--error' : ''}`}
              type="text"
              placeholder="e.g. WM-001"
              value={form.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
            />
            {errors.sku && <span className="form-error">{errors.sku}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input
                className={`form-input ${errors.price ? 'form-input--error' : ''}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
              />
              {errors.price && <span className="form-error">{errors.price}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Quantity in Stock</label>
              <input
                className={`form-input ${errors.quantity ? 'form-input--error' : ''}`}
                type="number"
                min="0"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
              />
              {errors.quantity && <span className="form-error">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
