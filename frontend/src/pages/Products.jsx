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
  const [activeFilter, setActiveFilter] = useState('all'); // all, inStock, lowStock, outOfStock

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

  // Filter products by search term AND selected filter tab
  const filtered = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'inStock') return p.quantity >= 10;
    if (activeFilter === 'lowStock') return p.quantity > 0 && p.quantity < 10;
    if (activeFilter === 'outOfStock') return p.quantity === 0;
    return true; // 'all'
  });

  // Helper to get initials and corresponding gradient name
  function getProductVisuals(name) {
    const char = name.trim().charAt(0).toUpperCase() || 'P';
    const charCode = char.charCodeAt(0);
    const gradients = ['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan'];
    const selectedGrad = gradients[charCode % gradients.length];
    return { char, selectedGrad };
  }

  if (loading) return <LoadingSpinner message="Loading products..." />;

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Product Inventory</h1>
          <p className="page-subtitle">Add, update, filter and track product inventory levels</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '2px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="toolbar-row">
        <div className="search-bar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'inStock', label: 'In Stock' },
            { id: 'lowStock', label: 'Low Stock' },
            { id: 'outOfStock', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${activeFilter === tab.id ? 'filter-tab--active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <svg className="empty-state-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="empty-state-card__text">
            {searchTerm || activeFilter !== 'all' 
              ? 'No products match your current search and filters' 
              : 'No products registered in the system yet. Click Add Product to begin!'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product details</th>
                <th>SKU Code</th>
                <th>Unit Price</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const { char, selectedGrad } = getProductVisuals(product.name);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <div className={`product-avatar product-avatar--${selectedGrad}`}>
                          {char}
                        </div>
                        <div>
                          <div className="cell-name">{product.name}</div>
                          <div className="cell-sub-id">ID: #{product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--neutral">{product.sku}</span>
                    </td>
                    <td className="cell-price">${product.price.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          product.quantity === 0
                            ? 'badge--danger stock-badge--pulse'
                            : product.quantity < 10
                            ? 'badge--warning'
                            : 'badge--success'
                        }`}
                      >
                        {product.quantity === 0 ? (
                          <>
                            <span className="badge-pulse-dot" />
                            Out of Stock
                          </>
                        ) : product.quantity < 10 ? (
                          `Low Stock (${product.quantity})`
                        ) : (
                          `In Stock (${product.quantity})`
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn--secondary btn--sm"
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
                );
              })}
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
