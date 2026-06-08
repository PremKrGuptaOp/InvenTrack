import { useState, useEffect } from 'react';
import { productAPI, customerAPI, orderAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        productAPI.getAll(),
        customerAPI.getAll(),
        orderAPI.getAll(),
      ]);

      const products = productsRes.data;
      const customers = customersRes.data;
      const orders = ordersRes.data;

      // products with less than 10 in stock
      const lowStock = products.filter((p) => p.quantity < 10);

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        lowStockProducts: lowStock,
      });

      // grab last 5 orders for the recent activity section
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const cards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: '⬡',
      gradient: 'blue',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: '◉',
      gradient: 'emerald',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: '◫',
      gradient: 'purple',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockProducts.length,
      icon: '△',
      gradient: stats.lowStockProducts.length > 0 ? 'amber' : 'cyan',
    },
  ];

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory & orders</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stat-grid">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card stat-card--${card.gradient}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="stat-card__header">
              <span className="stat-card__icon">{card.icon}</span>
              <span className="stat-card__label">{card.label}</span>
            </div>
            <div className="stat-card__value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent orders */}
        <div className="dashboard-panel">
          <h2 className="panel-title">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="empty-text">No orders yet</p>
          ) : (
            <div className="recent-list">
              {recentOrders.map((order) => (
                <div key={order.id} className="recent-item">
                  <div className="recent-item__info">
                    <span className="recent-item__id">Order #{order.id}</span>
                    <span className="recent-item__customer">
                      {order.customer_name}
                    </span>
                  </div>
                  <div className="recent-item__meta">
                    <span className="recent-item__amount">
                      ${order.total_amount.toFixed(2)}
                    </span>
                    <span className="recent-item__date">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock warning */}
        <div className="dashboard-panel">
          <h2 className="panel-title">
            Low Stock Alerts
            {stats.lowStockProducts.length > 0 && (
              <span className="panel-badge">{stats.lowStockProducts.length}</span>
            )}
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">✓</span>
              <p className="empty-text">All products are well-stocked</p>
            </div>
          ) : (
            <div className="lowstock-list">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="lowstock-item">
                  <div>
                    <span className="lowstock-item__name">{product.name}</span>
                    <span className="lowstock-item__sku">{product.sku}</span>
                  </div>
                  <span
                    className={`lowstock-item__qty ${
                      product.quantity === 0 ? 'lowstock-item__qty--zero' : ''
                    }`}
                  >
                    {product.quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
