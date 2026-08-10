import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Line,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  FiUsers,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiArrowRight,
  FiUser,
  FiTag,
} from "react-icons/fi";
import { fetchAdminDashboard } from "../../redux/slices/adminSlice";
import { formatPrice, formatDate, getStatusBadgeClass } from "../../utils/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const statStyles = [
  { icon: <FiUsers size={22} />, bg: "rgba(20, 184, 166, 0.14)", color: "#0d9488" },
  { icon: <FiPackage size={22} />, bg: "rgba(217, 119, 6, 0.14)", color: "#d97706" },
  { icon: <FiShoppingBag size={22} />, bg: "rgba(99, 102, 241, 0.14)", color: "#6366f1" },
  { icon: <FiDollarSign size={22} />, bg: "rgba(5, 150, 105, 0.14)", color: "#059669" },
];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard: dashboardData, loading } = useSelector((state) => state.admin);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
    setTimeout(() => setChartReady(true), 100);
  }, [dispatch]);

  const stats = [
    {
      title: "Total Users",
      value: dashboardData?.totalUsers ?? 0,
      subtitle: "Registered users",
    },
    {
      title: "Total Products",
      value: dashboardData?.totalProducts ?? 0,
      subtitle: "Listed products",
    },
    {
      title: "Total Orders",
      value: dashboardData?.totalOrders ?? 0,
      subtitle: "Orders placed",
    },
    {
      title: "Total Revenue",
      value: formatPrice(dashboardData?.totalRevenue ?? 0),
      subtitle: "Lifetime earnings",
    },
  ];

  const monthlySalesData = {
    labels: dashboardData?.monthlySales?.map((m) => m.month) ?? [],
    datasets: [
      {
        label: "Monthly Revenue (₹)",
        data: dashboardData?.monthlySales?.map((m) => m.revenue) ?? [],
        borderColor: "#0d9488",
        backgroundColor: "rgba(13, 148, 136, 0.12)",
        fill: true,
        tension: 0.45,
        pointBackgroundColor: "#0d9488",
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
    ],
  };

  const monthlySalesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(128,128,128,0.1)" },
        ticks: { color: "var(--text-muted)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "var(--text-muted)" },
      },
    },
  };

  const CHART_COLORS = ["#f59e0b", "#6366f1", "#0ea5e9", "#10b981", "#ef4444"];

  const orderStatusData = {
    labels: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    datasets: [
      {
        data: [
          dashboardData?.orderStatusDistribution?.PENDING ?? 0,
          dashboardData?.orderStatusDistribution?.CONFIRMED ?? 0,
          dashboardData?.orderStatusDistribution?.SHIPPED ?? 0,
          dashboardData?.orderStatusDistribution?.DELIVERED ?? 0,
          dashboardData?.orderStatusDistribution?.CANCELLED ?? 0,
        ],
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        borderColor: "var(--card-bg)",
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "var(--text-secondary)", padding: 14, usePointStyle: true },
      },
      title: { display: false },
    },
    cutout: "68%",
  };

  const quickLinks = [
    { label: "Manage Users", path: "/admin/users", icon: <FiUser size={18} /> },
    { label: "Manage Products", path: "/admin/products", icon: <FiPackage size={18} /> },
    { label: "Manage Orders", path: "/admin/orders", icon: <FiShoppingBag size={18} /> },
    { label: "Manage Categories", path: "/admin/categories", icon: <FiTag size={18} /> },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard</title>
      </Helmet>

      <Container fluid className="py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            <h2 className="mb-0">Dashboard Overview</h2>
            <p className="text-muted mb-0 small">Monitor your store's health at a glance</p>
          </div>
        </div>

        <Row className="g-3 mb-4">
          {stats.map((stat, idx) => (
            <Col xs={12} sm={6} lg={3} key={idx}>
              <div className="stat-card">
                {loading ? (
                  <Skeleton height={80} />
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <p className="text-muted mb-1 small fw-semibold">{stat.title}</p>
                        <div className="stat-value">{stat.value}</div>
                        <small className="text-muted">{stat.subtitle}</small>
                      </div>
                      <div
                        className="stat-icon"
                        style={{ backgroundColor: statStyles[idx].bg, color: statStyles[idx].color }}
                      >
                        {statStyles[idx].icon}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Col>
          ))}
        </Row>

        <Row className="g-3 mb-4">
          <Col lg={8}>
            <div className="chart-card h-100">
              <div className="mb-3">
                <h6 className="card-heading mb-0">Revenue Trend</h6>
                <small className="text-muted">Monthly sales over the last 12 months</small>
              </div>
              {loading || !chartReady ? (
                <Skeleton height={300} />
              ) : (
                <div style={{ height: 320 }}>
                  <Line data={monthlySalesData} options={monthlySalesOptions} />
                </div>
              )}
            </div>
          </Col>
          <Col lg={4}>
            <div className="chart-card h-100">
              <div className="mb-3">
                <h6 className="card-heading mb-0">Order Status</h6>
                <small className="text-muted">Distribution across all orders</small>
              </div>
              {loading || !chartReady ? (
                <Skeleton height={300} />
              ) : (
                <div style={{ height: 320 }}>
                  <Doughnut data={orderStatusData} options={doughnutOptions} />
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Row className="g-3">
          <Col lg={8}>
            <div className="chart-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-heading mb-0">Recent Orders</h6>
                <Link to="/admin/orders" className="btn btn-outline-brand btn-sm d-flex align-items-center gap-1">
                  View All <FiArrowRight size={14} />
                </Link>
              </div>
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5}><Skeleton height={28} /></td>
                        </tr>
                      ))
                    ) : (
                      (dashboardData?.recentOrders || []).slice(0, 10).map((order) => (
                        <tr key={order._id}>
                          <td className="fw-semibold">#{order._id?.slice(-8).toUpperCase()}</td>
                          <td>{order.user?.name ?? "N/A"}</td>
                          <td className="fw-semibold">{formatPrice(order.totalAmount)}</td>
                          <td>
                            <span className={`badge-status ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="text-muted">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <div className="chart-card h-100">
              <h6 className="card-heading mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                {quickLinks.map((link) => (
                  <Link key={link.path} to={link.path}>
                    <Card
                      className="border-0 mb-0"
                      style={{
                        background: "var(--bg-soft)",
                        border: "1px solid var(--border-color) !important",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <Card.Body className="d-flex align-items-center justify-content-between p-3">
                        <span className="d-flex align-items-center gap-2 fw-semibold" style={{ color: "var(--text-primary)" }}>
                          <span style={{ color: "var(--brand-light)" }}>{link.icon}</span>
                          {link.label}
                        </span>
                        <FiArrowRight style={{ color: "var(--text-muted)" }} />
                      </Card.Body>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AdminDashboard;
