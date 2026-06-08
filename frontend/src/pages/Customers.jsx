import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { customerAPI, orderAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertContainer } from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, getAvatarDetails } from '../utils/formatters';
import './Products.css'; // Reuse table styles
import './Customers.css';

const emptyForm = { name: '', email: '', phone: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  const addAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [custRes, ordRes] = await Promise.all([
        customerAPI.getAll(),
        orderAPI.getAll(),
      ]);
      setCustomers(custRes.data);
      setOrders(ordRes.data);
    } catch (err) {
      addAlert('Failed to load customer database', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await customerAPI.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      addAlert('Customer added successfully');
      setModalOpen(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create customer';
      addAlert(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await customerAPI.delete(confirmDelete.id);
      addAlert('Customer deleted');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not delete customer';
      addAlert(msg, 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleInputChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Correlate customer IDs with total purchases and total amounts
  const customerStats = useMemo(() => {
    const statsMap = {};
    orders.forEach((o) => {
      if (!statsMap[o.customer_id]) {
        statsMap[o.customer_id] = { count: 0, spent: 0 };
      }
      statsMap[o.customer_id].count += 1;
      statsMap[o.customer_id].spent += o.total_amount;
    });
    return statsMap;
  }, [orders]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">Manage customer contacts, details, and purchasing metrics</p>
        </div>
        <button className="btn btn--primary" onClick={openModal}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '2px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Toolbar for Search & List/Grid Toggles */}
      <div className="toolbar-row">
        <div className="search-bar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* View Toggle Buttons */}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'view-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid View"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'view-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List View"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-card">
          <svg className="empty-state-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
          <p className="empty-state-card__text">
            {searchTerm 
              ? 'No customers match your search query' 
              : 'No customers in the database yet. Click Add Customer to get started!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="customer-grid">
          {filtered.map((customer) => {
            const { char, selectedGrad } = getAvatarDetails(customer.name, 'customer');
            const stats = customerStats[customer.id] || { count: 0, spent: 0 };
            return (
              <div key={customer.id} className="customer-card">
                <button
                  className="customer-card__delete"
                  onClick={() => setConfirmDelete(customer)}
                  title="Delete Customer"
                >
                  ✕
                </button>
                <div className={`customer-card__avatar customer-card__avatar--${selectedGrad}`}>
                  {char}
                </div>
                <h3 className="customer-card__name">{customer.name}</h3>
                <div className="customer-card__details">
                  <div className="customer-card__detail-item">
                    <svg className="customer-card__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{customer.email}</span>
                  </div>
                  <div className="customer-card__detail-item">
                    <svg className="customer-card__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{customer.phone}</span>
                  </div>
                </div>

                <div className="customer-card__stats">
                  <div className="customer-card__stat-item">
                    <div className="customer-card__stat-val">{stats.count}</div>
                    <div className="customer-card__stat-lbl">Orders</div>
                  </div>
                  <div className="customer-card__stat-item">
                    <div className="customer-card__stat-val">{formatCurrency(stats.spent)}</div>
                    <div className="customer-card__stat-lbl">Spent</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const { char, selectedGrad } = getAvatarDetails(customer.name, 'customer');
                const stats = customerStats[customer.id] || { count: 0, spent: 0 };
                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="product-cell">
                        <div className={`product-avatar product-avatar--${selectedGrad}`}>
                          {char}
                        </div>
                        <div className="cell-name">{customer.name}</div>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <span className="badge badge--neutral">{stats.count} orders</span>
                    </td>
                    <td className="cell-price">{formatCurrency(stats.spent)}</td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm btn-delete"
                        onClick={() => setConfirmDelete(customer)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              type="text"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              type="email"
              placeholder="jane.smith@example.com"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
              type="tel"
              placeholder="+1 (555) 019-2834"
              value={form.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
