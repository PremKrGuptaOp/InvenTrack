import { useState, useEffect, useCallback } from 'react';
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

  // create order modal
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // view order detail
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // delete
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
      addAlert('Failed to load data', 'error');
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

  // compute estimated total from the current form
  function getEstimatedTotal() {
    let total = 0;
    for (const item of orderItems) {
      const product = products.find((p) => p.id === Number(item.product_id));
      if (product && item.quantity > 0) {
        total += product.price * item.quantity;
      }
    }
    return total;
  }

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
      addAlert('Order created successfully');
      setCreateOpen(false);
      loadData(); // refresh everything since stock changes
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create order';
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
      addAlert('Order cancelled and stock restored');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete order';
      addAlert(msg, 'error');
    } finally {
      setConfirmDelete(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <div className="page animate-fade-in-up">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and manage customer orders</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          + New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">◫</span>
          <p className="empty-text">No orders yet. Create your first order!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="cell-name">#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td className="cell-price">${order.total_amount.toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => viewOrderDetail(order.id)}
                      >
                        View
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

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleCreateOrder}>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className={`form-input form-select ${formErrors.customer ? 'form-input--error' : ''}`}
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                if (formErrors.customer) setFormErrors((p) => ({ ...p, customer: undefined }));
              }}
            >
              <option value="">-- Select a customer --</option>
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
              <label className="form-label">Order Items</label>
              <button type="button" className="btn btn--secondary btn--sm" onClick={addItem}>
                + Add Item
              </button>
            </div>

            {orderItems.map((item, idx) => {
              const itemErr = formErrors.items?.[idx] || {};
              return (
                <div key={idx} className="order-item-row">
                  <div className="order-item-field order-item-field--product">
                    <select
                      className={`form-input form-select ${itemErr.product ? 'form-input--error' : ''}`}
                      value={item.product_id}
                      onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price.toFixed(2)} (Stock: {p.quantity})
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
                      className="btn btn--ghost btn--sm btn-delete"
                      onClick={() => removeItem(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="order-total">
            <span className="order-total__label">Estimated Total:</span>
            <span className="order-total__value">${getEstimatedTotal().toFixed(2)}</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Order #${detailOrder?.id || ''}`}
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner message="Loading order details..." />
        ) : detailOrder ? (
          <div className="order-detail">
            <div className="order-detail__grid">
              <div className="order-detail__field">
                <span className="form-label">Customer</span>
                <span>{detailOrder.customer_name}</span>
              </div>
              <div className="order-detail__field">
                <span className="form-label">Date</span>
                <span>{new Date(detailOrder.created_at).toLocaleString()}</span>
              </div>
              <div className="order-detail__field">
                <span className="form-label">Total Amount</span>
                <span className="order-detail__total">
                  ${detailOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <h3 className="order-detail__items-title">Items</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="cell-name">{item.product_name}</td>
                      <td><span className="badge badge--neutral">{item.product_sku}</span></td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td className="cell-price">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete confirmation */}
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
