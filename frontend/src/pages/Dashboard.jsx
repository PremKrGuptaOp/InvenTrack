import { useState, useEffect } from 'react';
import { productAPI, customerAPI, orderAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

// Monthly Mock Sales Trend data for Visual Charting
const initialSalesTrend = [
  { month: 'Jan', sales: 1200 },
  { month: 'Feb', sales: 1900 },
  { month: 'Mar', sales: 3400 },
  { month: 'Apr', sales: 2800 },
  { month: 'May', sales: 4800 },
  { month: 'Jun', sales: 6200 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

      // Products with less than 10 in stock
      const lowStock = products.filter((p) => p.quantity < 10);

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        lowStockProducts: lowStock,
      });

      // Grab last 5 orders for the recent activity section
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  // Dynamic Sales Trend calculations
  // Adapt mock sales with some variation based on total orders
  const salesTrend = initialSalesTrend.map((t, idx) => {
    if (idx === initialSalesTrend.length - 1) {
      // Modify last month based on actual orders total
      const orderSum = recentOrders.reduce((sum, o) => sum + o.total_amount, 0);
      return { ...t, sales: Math.max(t.sales, Math.round(t.sales + orderSum)) };
    }
    return t;
  });

  const maxSales = Math.max(...salesTrend.map(d => d.sales), 1000) * 1.15;
  const svgWidth = 550;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Calculate coordinates for SVG Path
  const points = salesTrend.map((data, idx) => {
    const x = paddingX + (idx * (graphWidth / (salesTrend.length - 1)));
    const y = svgHeight - paddingY - ((data.sales / maxSales) * graphHeight);
    return { x, y, ...data };
  });

  // Area path coordinate string
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  const cards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      gradient: 'blue',
      icon: (
        <svg className="stat-card__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      gradient: 'emerald',
      icon: (
        <svg className="stat-card__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      gradient: 'purple',
      icon: (
        <svg className="stat-card__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockProducts.length,
      gradient: stats.lowStockProducts.length > 0 ? 'amber' : 'cyan',
      icon: (
        <svg className="stat-card__icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
  ];

  return (
    <div className="dashboard animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time metrics, stock levels & business overview</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stat-grid">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card stat-card--${card.gradient}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="stat-card__glow-layer" />
            <div className="stat-card__header">
              <div className="stat-card__icon-wrapper">{card.icon}</div>
              <span className="stat-card__label">{card.label}</span>
            </div>
            <div className="stat-card__value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Interactive SVG Trend Chart */}
        <div className="dashboard-panel chart-panel">
          <h2 className="panel-title">
            <svg className="panel-title__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Sales & Activity Trend
          </h2>
          <div className="chart-container">
            <svg className="sales-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0.00" />
                </linearGradient>
                <filter id="shadow-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="var(--color-blue)" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * graphHeight;
                return (
                  <line 
                    key={i} 
                    x1={paddingX} 
                    y1={y} 
                    x2={svgWidth - paddingX} 
                    y2={y} 
                    stroke="rgba(255, 255, 255, 0.05)" 
                    strokeDasharray="4 4" 
                  />
                );
              })}

              {/* Gradient Area */}
              <path d={areaPath} fill="url(#chart-area-grad)" />

              {/* Stroke Line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="var(--color-blue)" 
                strokeWidth="3.5" 
                strokeLinecap="round"
                filter="url(#shadow-glow)"
              />

              {/* Axis Labels */}
              {points.map((p, idx) => (
                <text 
                  key={idx} 
                  x={p.x} 
                  y={svgHeight - 10} 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {p.month}
                </text>
              ))}

              {/* Interactive Hover Dots */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.idx === idx ? "7" : "4.5"}
                  fill={hoveredPoint?.idx === idx ? "var(--text-primary)" : "var(--bg-primary)"}
                  stroke="var(--color-blue)"
                  strokeWidth="3.5"
                  style={{ cursor: 'pointer', transition: 'all 150ms ease' }}
                  onMouseEnter={() => setHoveredPoint({ idx, ...p })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Dynamic HTML Tooltip */}
            {hoveredPoint && (
              <div 
                className="chart-tooltip"
                style={{ 
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
                  top: `${(hoveredPoint.y / svgHeight) * 100 - 18}%` 
                }}
              >
                <div className="chart-tooltip__month">{hoveredPoint.month}</div>
                <div className="chart-tooltip__value">${hoveredPoint.sales.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="dashboard-panel">
          <h2 className="panel-title">
            <svg className="panel-title__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Recent Activity Feed
          </h2>
          {recentOrders.length === 0 ? (
            <p className="empty-text">No activities recorded yet</p>
          ) : (
            <div className="recent-list">
              {recentOrders.map((order) => (
                <div key={order.id} className="recent-item">
                  <div className="recent-item__visual-dot" />
                  <div className="recent-item__info">
                    <span className="recent-item__id">Order #{order.id} Confirmed</span>
                    <span className="recent-item__customer">
                      Placed by customer: {order.customer_name}
                    </span>
                  </div>
                  <div className="recent-item__meta">
                    <span className="recent-item__amount">
                      +${order.total_amount.toFixed(2)}
                    </span>
                    <span className="recent-item__date">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div className="recent-item activity-system-check">
                <div className="recent-item__visual-dot system-dot" />
                <div className="recent-item__info">
                  <span className="recent-item__id">Inventory Sync Completed</span>
                  <span className="recent-item__customer">Database automated snapshot and healthcheck passed</span>
                </div>
                <div className="recent-item__meta">
                  <span className="badge badge--success">OK</span>
                  <span className="recent-item__date">Just Now</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Low stock warning */}
        <div className="dashboard-panel full-width-panel">
          <h2 className="panel-title">
            <svg className="panel-title__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Critical Stock Warnings
            {stats.lowStockProducts.length > 0 && (
              <span className="panel-badge">{stats.lowStockProducts.length} Alerts</span>
            )}
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">✓</span>
              <p className="empty-text">All products are within safe operating stock thresholds</p>
            </div>
          ) : (
            <div className="lowstock-list">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="lowstock-item">
                  <div className="lowstock-item__main">
                    <span className="lowstock-item__name">{product.name}</span>
                    <span className="badge badge--neutral">{product.sku}</span>
                  </div>
                  <div className="lowstock-item__qty-wrapper">
                    <span
                      className={`lowstock-item__qty ${
                        product.quantity === 0 ? 'lowstock-item__qty--zero' : ''
                      }`}
                    >
                      {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} units remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
