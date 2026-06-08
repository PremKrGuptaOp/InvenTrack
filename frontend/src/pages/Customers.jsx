import { useState, useEffect, useCallback } from 'react';
import { customerAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertContainer } from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import './Products.css'; // reuse table styles

const emptyForm = { name: '', email: '', phone: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data);
    } catch (err) {
      addAlert('Failed to load customers', 'error');
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
      loadCustomers();
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
      loadCustomers();
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

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading customers..." />;

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
        <button className="btn btn--primary" onClick={openModal}>
          + Add Customer
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">◉</span>
          <p className="empty-text">
            {searchTerm ? 'No customers match your search' : 'No customers yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td className="cell-name">{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button
                      className="btn btn--ghost btn--sm btn-delete"
                      onClick={() => setConfirmDelete(customer)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Customer"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              type="text"
              placeholder="John Doe"
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
              placeholder="john@example.com"
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
              placeholder="+1 (555) 123-4567"
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
              {submitting ? 'Saving...' : 'Add Customer'}
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
