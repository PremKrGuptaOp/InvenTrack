import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { orderAPI, customerAPI, productAPI } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertContainer } from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import './Products.css';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  // Create order modal
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // View order detail
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        orderAPI.getAll(),
        customerAPI.getAll(),
        productAPI.getAll(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      addAlert('Failed to load orders data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedCustomer('');
    setOrderItems([{ product_id: '', quantity: 1 }]);
    setFormErrors({});
    setCreateOpen(true);
  }

  function addItem() {
    setOrderItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
  }

  function removeItem(index) {
    if (orderItems.length <= 1) return;
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index, field, value) {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  // Compute subtotal and item summaries
  const orderSummaryDetails = useMemo(() => {
    let subtotal = 0;
    const items = [];
    
    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === Number(item.product_id));
      if (product && item.quantity > 0) {
        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        items.push({
          name: product.name,
          qty: item.quantity,
          price: product.price,
          subtotal: itemSubtotal,
        });
      }
    });

    const tax = subtotal * 0.08; // 8% simulated sales tax
    const grandTotal = subtotal + tax;

    return { subtotal, tax, grandTotal, items };
  }, [orderItems, products]);

  function validateOrder() {
    const errs = {};
    if (!selectedCustomer) errs.customer = 'Please select a customer';

    const itemErrors = [];
    let hasItemError = false;

    orderItems.forEach((item, i) => {
      const err = {};
      if (!item.product_id) {
        err.product = 'Select a product';
        hasItemError = true;
      } else {
        const product = products.find((p) => p.id === Number(item.product_id));
        if (product && product.quantity < item.quantity) {
          err.quantity = `Insuff. Stock (${product.quantity})`;
          hasItemError = true;
        }
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty <= 0) {
        err.quantity = 'Must be > 0';
        hasItemError = true;
      }
      itemErrors.push(err);
    });

    if (hasItemError) errs.items = itemErrors;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!validateOrder()) return;

    setSubmitting(true);
    const payload = {
      customer_id: Number(selectedCustomer),
      items: orderItems.map((item) => ({
        product_id: Number(item.product_id),
        quantity: parseInt(item.quantity, 10),
      })),
    };

    try {
      await orderAPI.create(payload);
      addAlert('Order created and inventory updated');
      setCreateOpen(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order';
      addAlert(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function viewOrderDetail(orderId) {
    setDetailLoading(true);
    try {
      const res = await orderAPI.getById(orderId);
      setDetailOrder(res.data);
    } catch (err) {
      addAlert('Could not load order details', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await orderAPI.delete(confirmDelete.id);
      addAlert('Order cancelled successfully, stock restored');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order';
      addAlert(msg, 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  const activeCustomer = customers.find(c => c.id === Number(selectedCustomer));

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Process transactions, view invoices, and track orders</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '2px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state-card">
          <svg className="empty-state-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
          <p className="empty-state-card__text">No orders recorded yet. Click New Order to run a checkout.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer Name</th>
                <th>Total Value</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="order-number-pill">#{order.id}</span>
                  </td>
                  <td className="cell-name">{order.customer_name}</td>
                  <td className="cell-price">${order.total_amount.toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className="badge badge--success">
                      <span className="badge-pos-dot" />
                      Completed
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => viewOrderDetail(order.id)}
                      >
                        Invoice
                      </button>
                      <button
                        className="btn btn--ghost btn--sm btn-delete"
                        onClick={() => setConfirmDelete(order)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Order Modal (Split-Screen Checkout) */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Checkout Point of Sale"
        size="lg"
      >
        <form onSubmit={handleCreateOrder} className="checkout-layout">
          {/* Left panel: Form Controls */}
          <div className="checkout-controls">
            <div className="form-group">
              <label className="form-label">Select Customer</label>
              <select
                className={`form-input form-select ${formErrors.customer ? 'form-input--error' : ''}`}
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  if (formErrors.customer) setFormErrors((p) => ({ ...p, customer: undefined }));
                }}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              {formErrors.customer && <span className="form-error">{formErrors.customer}</span>}
            </div>

            <div className="order-items-section">
              <div className="order-items-header">
                <label className="form-label">Add Transaction Items</label>
                <button type="button" className="btn btn--secondary btn--sm" onClick={addItem}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>

              {orderItems.map((item, idx) => {
                const itemErr = formErrors.items?.[idx] || {};
                return (
                  <div key={idx} className="order-item-row animate-fade-in">
                    <div className="order-item-field order-item-field--product">
                      <select
                        className={`form-input form-select ${itemErr.product ? 'form-input--error' : ''}`}
                        value={item.product_id}
                        onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${p.price.toFixed(2)} (Qty: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="order-item-field order-item-field--qty">
                      <input
                        className={`form-input ${itemErr.quantity ? 'form-input--error' : ''}`}
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        className="btn btn--ghost btn-delete-item"
                        onClick={() => removeItem(idx)}
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    )}
                    {itemErr.quantity && <div className="form-error item-row-error">{itemErr.quantity}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Receipt Widget */}
          <div className="checkout-receipt">
            <div className="receipt-border-top" />
            <div className="receipt-header">
              <h3 className="receipt-title">ORDER RECEIPT</h3>
              <p className="receipt-subtitle">INVENTRACK POS SYSTEM</p>
            </div>
            
            <div className="receipt-meta">
              <div>Customer: {activeCustomer ? activeCustomer.name : 'Unspecified'}</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-items-list">
              {orderSummaryDetails.items.length === 0 ? (
                <div className="receipt-empty">No items added to summary</div>
              ) : (
                orderSummaryDetails.items.map((item, i) => (
                  <div key={i} className="receipt-item-line">
                    <div className="receipt-item-info">
                      <span className="receipt-item-name">{item.name}</span>
                      <span className="receipt-item-qty">x{item.qty} @ ${item.price.toFixed(2)}</span>
                    </div>
                    <span className="receipt-item-price">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="receipt-divider" />

            <div className="receipt-totals">
              <div className="receipt-total-line">
                <span>Subtotal:</span>
                <span>${orderSummaryDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-total-line">
                <span>Tax (8%):</span>
                <span>${orderSummaryDetails.tax.toFixed(2)}</span>
              </div>
              <div className="receipt-divider dotted" />
              <div className="receipt-total-line receipt-total-line--grand">
                <span>TOTAL:</span>
                <span>${orderSummaryDetails.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <p>Thank you for choosing InvenTrack</p>
              <div className="receipt-barcode" />
            </div>

            <div className="form-actions receipt-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Invoice Receipt`}
        size="md"
      >
        {detailLoading ? (
          <LoadingSpinner message="Loading invoice..." />
        ) : detailOrder ? (
          <div className="invoice-container">
            <div className="invoice-header">
              <div>
                <h3 className="invoice-logo">InvenTrack Invoice</h3>
                <p className="invoice-meta-sub">ID: #{detailOrder.id}</p>
              </div>
              <span className="badge badge--success">Paid</span>
            </div>

            <div className="invoice-billing">
              <div>
                <span className="invoice-label">Billed To</span>
                <div className="invoice-client-name">{detailOrder.customer_name}</div>
                <div className="invoice-client-meta">Date: {new Date(detailOrder.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="receipt-divider" />

            <div className="invoice-items-summary">
              {detailOrder.items?.map((item) => (
                <div key={item.id} className="invoice-item-line">
                  <div className="invoice-item-main">
                    <span className="invoice-item-title">{item.product_name}</span>
                    <span className="invoice-item-sub">SKU: {item.product_sku} | {item.quantity} x ${item.unit_price.toFixed(2)}</span>
                  </div>
                  <span className="invoice-item-total">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider dotted" />

            <div className="invoice-grand-total">
              <span>Grand Total</span>
              <span>${detailOrder.total_amount.toFixed(2)}</span>
            </div>

            <div className="invoice-footer">
              <p>System Generated Invoice. All accounts paid.</p>
              <button className="btn btn--secondary btn--sm invoice-print-btn" onClick={() => window.print()}>
                Print Invoice
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cancel confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Cancel Order"
        message={`Cancel order #${confirmDelete?.id}? Stock will be restored for all items.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
