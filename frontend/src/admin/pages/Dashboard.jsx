import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  FaRupeeSign,
  FaClipboardList,
  FaUsers,
  FaBox,
  FaStore,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import { dashboardApi, analyticsApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, formatDate, fullName } from '../utils/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const BRAND = '#134e4a';
const ACCENT = '#d97706';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.get(), analyticsApi.get(null, null, 5)])
      .then(([d, a]) => {
        setDashboard(d.data);
        setAnalytics(a.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading dashboard…" />;
  if (!dashboard) return <EmptyState title="Unable to load dashboard" />;

  const s = analytics?.summary || {};
  const monthly = analytics?.monthlyRevenue || [];

  const revenueChartData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: 'Revenue',
        data: monthly.map((m) => Number(m.revenue)),
        borderColor: BRAND,
        backgroundColor: 'rgba(19, 78, 74, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: ACCENT,
        pointRadius: 4,
      },
    ],
  };

  const orderChartData = {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: 'Orders',
        data: monthly.map((m) => Number(m.orders)),
        backgroundColor: 'rgba(217, 119, 6, 0.65)',
        borderRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: Object.keys(analytics?.orderStatusDistribution || {}),
    datasets: [
      {
        data: Object.values(analytics?.orderStatusDistribution || {}),
        backgroundColor: [
          '#f59e0b',
          '#0ea5e9',
          '#3b82f6',
          '#06b6d4',
          '#10b981',
          '#ef4444',
          '#6b7280',
          '#111827',
        ],
        borderWidth: 0,
      },
    ],
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatPrice(s.totalRevenue),
      icon: FaRupeeSign,
      color: '#134e4a',
      bg: 'rgba(19, 78, 74, 0.1)',
      sub: `${s.totalOrders || 0} orders`,
    },
    {
      label: 'Total Orders',
      value: s.totalOrders || 0,
      icon: FaClipboardList,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.12)',
      sub: `${s.todayOrders || 0} today`,
    },
    {
      label: 'Customers',
      value: s.totalCustomers || 0,
      icon: FaUsers,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.12)',
      sub: `${s.totalSellers || 0} sellers`,
    },
    {
      label: 'Products',
      value: s.totalProducts || 0,
      icon: FaBox,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      sub: 'in catalog',
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your store's performance">
        <span className="btn btn-outline btn-sm">
          <FaStore /> Today revenue: {formatPrice(s.todayRevenue)}
        </span>
      </PageHeader>

      <div className="grid-cols grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card premium-card animate-slide-down" key={stat.label}>
              <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                <Icon />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-change up">
                  <FaArrowUp style={{ fontSize: 10 }} /> {stat.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-cols grid-cols-3 mt-4">
        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3 className="card-title">Monthly Revenue</h3>
          </div>
          <div className="card-body">
            <div className="chart-box">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3 className="card-title">Order Status</h3>
          </div>
          <div className="card-body">
            <div className="chart-box">
              <Doughnut
                data={statusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </div>
        </div>

        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3 className="card-title">Monthly Orders</h3>
          </div>
          <div className="card-body">
            <div className="chart-box">
              <Bar
                data={orderChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-cols grid-cols-2 mt-4">
        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/orders')}>
              View all
            </button>
          </div>
          <div className="table-wrap">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.recentOrders || []).slice(0, 6).map((o) => (
                  <tr
                    key={o.id}
                    className="clickable"
                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                  >
                    <td className="mono">#{o.id}</td>
                    <td>{fullName(o.user)}</td>
                    <td>{formatPrice(o.totalAmount)}</td>
                    <td>
                      <StatusBadge type="order" value={o.orderStatus} />
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!dashboard.recentOrders || dashboard.recentOrders.length === 0) && (
              <EmptyState title="No recent orders" />
            )}
          </div>
        </div>

        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.5s' }}>
          <div className="card-header">
            <h3 className="card-title">Top Products</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/analytics')}>
              Full analytics
            </button>
          </div>
          <div className="card-body">
            {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
              <EmptyState title="No product sales yet" />
            )}
            {analytics?.topProducts?.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 clickable"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--bg)' }}
                onClick={() => navigate(`/admin/products?highlight=${p.id}`)}
              >
                <span className="badge" style={{ background: 'rgba(19,78,74,0.1)', color: BRAND }}>
                  #{i + 1}
                </span>
                <img
                  src={p.imageUrl || '/uploads/placeholder.svg'}
                  alt={p.name}
                  className="product-thumb"
                  onError={(e) => {
                    e.target.src = '/uploads/placeholder.svg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">
                    {p.name}
                  </div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    {p.categoryName || 'Uncategorized'} · {p.totalQuantitySold} sold
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{formatPrice(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analytics?.topCustomers?.length > 0 && (
        <div className="premium-card animate-slide-down" style={{ animationDelay: '0.6s' }}>
          <div className="card-header">
            <h3 className="card-title">Top Customers</h3>
          </div>
          <div className="table-wrap">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCustomers.map((c, i) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/admin/users/${c.id}`)}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.totalOrders}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
