import { useEffect, useState } from 'react';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaBox, FaTruck, FaUsers, FaClipboardList } from 'react-icons/fa';
import { analyticsApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { formatPrice, formatDateTime } from '../utils/helpers';

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

const COLORS = [
  '#134e4a',
  '#0d9488',
  '#d97706',
  '#ea580c',
  '#0284c7',
  '#7c3aed',
  '#db2777',
  '#16a34a',
  '#f59e0b',
  '#64748b',
];

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tab, setTab] = useState('monthly');

  const load = () => {
    setLoading(true);
    analyticsApi
      .get(from || null, to || null, 10)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) return <Loading text="Loading analytics…" />;
  if (!data) return <EmptyState title="Unable to load analytics" />;

  const s = data.summary || {};
  const trend = data[`${tab}Revenue`] || [];

  const revenueChart = {
    labels: trend.map((p) => p.label),
    datasets: [
      {
        label: 'Revenue',
        data: trend.map((p) => Number(p.revenue)),
        borderColor: BRAND,
        backgroundColor: 'rgba(19, 78, 74, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: ACCENT,
        pointRadius: 4,
      },
    ],
  };

  const orderChart = {
    labels: trend.map((p) => p.label),
    datasets: [
      {
        label: 'Orders',
        data: trend.map((p) => Number(p.orders)),
        backgroundColor: 'rgba(217, 119, 6, 0.65)',
        borderRadius: 6,
      },
    ],
  };

  const orderStatusData = {
    labels: Object.keys(data.orderStatusDistribution || {}),
    datasets: [
      {
        data: Object.values(data.orderStatusDistribution || {}),
        backgroundColor: COLORS,
        borderWidth: 0,
      },
    ],
  };

  const paymentStatusData = {
    labels: Object.keys(data.paymentStatusDistribution || {}),
    datasets: [
      {
        data: Object.values(data.paymentStatusDistribution || {}),
        backgroundColor: COLORS,
        borderWidth: 0,
      },
    ],
  };

  const categoryMax = Math.max(
    1,
    ...(data.categoryBreakdown || []).map((c) => Number(c.orderCount || c.salesCount || c.revenue || 1))
  );

  const stats = [
    { label: 'Total Revenue', value: formatPrice(s.totalRevenue), icon: FaTruck },
    { label: 'Total Orders', value: s.totalOrders ?? 0, icon: FaClipboardList },
    { label: 'Customers', value: s.totalCustomers ?? 0, icon: FaUsers },
    { label: 'Products', value: s.totalProducts ?? 0, icon: FaBox },
    { label: 'Avg Order Value', value: formatPrice(s.averageOrderValue), icon: FaTruck },
    { label: 'This Month Revenue', value: formatPrice(s.thisMonthRevenue), icon: FaTruck },
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Sales performance and insights">
        <input
          className="form-control"
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          title="From date"
        />
        <input
          className="form-control"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          title="To date"
        />
        <button className="btn btn-primary btn-sm" onClick={load}>
          Apply
        </button>
      </PageHeader>

      <div className="grid-cols grid-cols-3">
        {stats.map((st) => {
          const Icon = st.icon;
          return (
            <div className="card stat-card" key={st.label}>
              <div className="stat-icon">
                <Icon />
              </div>
              <div>
                <div className="stat-label">{st.label}</div>
                <div className="stat-value">{st.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid-cols grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue</h3>
          </div>
          <div className="card-body">
            <Line data={revenueChart} options={{ maintainAspectRatio: false }} height={260} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Orders</h3>
          </div>
          <div className="card-body">
            <Bar data={orderChart} options={{ maintainAspectRatio: false }} height={260} />
          </div>
        </div>
      </div>

      <div className="grid-cols grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Order status distribution</h3>
          </div>
          <div className="card-body flex-center" style={{ minHeight: 220 }}>
            <Doughnut data={orderStatusData} options={{ maintainAspectRatio: false }} height={200} width={200} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment status distribution</h3>
          </div>
          <div className="card-body flex-center" style={{ minHeight: 220 }}>
            <Doughnut data={paymentStatusData} options={{ maintainAspectRatio: false }} height={200} width={200} />
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Category breakdown</h3>
        </div>
        <div className="card-body">
          {(data.categoryBreakdown || []).length === 0 ? (
            <EmptyState title="No category data" />
          ) : (
            data.categoryBreakdown.map((c, i) => {
              const val = Number(c.orderCount || c.salesCount || c.revenue || 0);
              return (
                <div key={c.name || c.categoryName || i} className="mb-3">
                  <div className="flex-between mb-1" style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{c.name || c.categoryName}</span>
                    <span className="muted">
                      {c.orderCount != null && `${c.orderCount} orders · `}
                      {c.revenue != null ? formatPrice(c.revenue) : ''}
                    </span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${(val / categoryMax) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid-cols grid-cols-2 mt-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top products</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(data.topProducts || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl || '/uploads/placeholder.svg'} alt={p.name} className="product-thumb" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div className="muted" style={{ fontSize: 11.5 }}>{p.categoryName}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.totalQuantitySold}</td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top customers</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Last order</th>
                </tr>
              </thead>
              <tbody>
                {(data.topCustomers || []).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{c.email}</div>
                    </td>
                    <td>{c.totalOrders}</td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(c.totalSpent)}</td>
                    <td>{formatDateTime(c.lastOrderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
