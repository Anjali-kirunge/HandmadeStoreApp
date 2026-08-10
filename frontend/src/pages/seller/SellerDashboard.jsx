import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { FiPackage, FiShoppingBag, FiDollarSign, FiClock, FiPlus, FiArrowRight } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import Skeleton from 'react-loading-skeleton';
import { fetchSellerDashboard } from '../../redux/slices/sellerSlice';
import { formatPrice, formatDate, getStatusBadgeClass } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body className="d-flex align-items-center">
      <div
        className="d-flex align-items-center justify-content-center rounded-circle me-3"
        style={{ width: 48, height: 48, backgroundColor: `${color}15`, color }}
      >
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted mb-0 small">{title}</p>
        <h4 className="mb-0 fw-bold">{value}</h4>
      </div>
    </Card.Body>
  </Card>
);

const DashboardSkeleton = () => (
  <div>
    <Skeleton height={32} width={200} className="mb-4" />
    <Row className="g-3 mb-4">
      {[1, 2, 3, 4].map((i) => (
        <Col xs={12} sm={6} lg={3} key={i}>
          <Skeleton height={100} className="rounded" />
        </Col>
      ))}
    </Row>
    <Row className="g-4">
      <Col lg={8}>
        <Skeleton height={300} className="rounded" />
      </Col>
      <Col lg={4}>
        <Skeleton height={300} className="rounded" />
      </Col>
    </Row>
  </div>
);

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchSellerDashboard());
  }, [dispatch]);

  if (loading && !dashboard) {
    return (
      <Container fluid>
        <Helmet>
          <title>Seller Dashboard - Handmade Store</title>
        </Helmet>
        <DashboardSkeleton />
      </Container>
    );
  }

  const stats = {
    totalProducts: dashboard?.totalProducts ?? 0,
    totalOrders: dashboard?.totalOrders ?? 0,
    totalRevenue: dashboard?.totalRevenue ?? 0,
    pendingOrders: dashboard?.pendingOrders ?? 0,
  };

  const recentOrders = dashboard?.recentOrders?.slice(0, 5) || [];

  const revenueData = dashboard?.monthlyRevenue || [];
  const monthLabels = revenueData.map((item) => item.month || item.label || '');

  const chartData = {
    labels: monthLabels.length > 0 ? monthLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: monthLabels.length > 0 ? revenueData.map((item) => item.amount || item.revenue || 0) : [0, 0, 0, 0, 0, 0],
        borderColor: '#FF9900',
        backgroundColor: 'rgba(255, 153, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF9900',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Revenue: ${formatPrice(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`,
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <Container fluid>
      <Helmet>
        <title>Seller Dashboard - Handmade Store</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">Dashboard</h4>
        <Link to="/seller/products/add">
          <Button variant="warning" className="d-flex align-items-center gap-2">
            <FiPlus size={16} /> Add Product
          </Button>
        </Link>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Total Products" value={stats.totalProducts} icon={FiPackage} color="#FF9900" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Total Orders" value={stats.totalOrders} icon={FiShoppingBag} color="#146EB4" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={FiDollarSign} color="#067D62" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Pending Orders" value={stats.pendingOrders} icon={FiClock} color="#E47911" />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold mb-3">Revenue Overview</h6>
              <div style={{ height: 300 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                <Link to="/seller/products/add" className="text-decoration-none">
                  <Button variant="outline-warning" className="w-100 text-start d-flex align-items-center gap-2">
                    <FiPlus size={16} /> Add New Product
                  </Button>
                </Link>
                <Link to="/seller/orders" className="text-decoration-none">
                  <Button variant="outline-primary" className="w-100 text-start d-flex align-items-center gap-2">
                    <FiShoppingBag size={16} /> View All Orders
                  </Button>
                </Link>
                <Link to="/seller/products" className="text-decoration-none">
                  <Button variant="outline-secondary" className="w-100 text-start d-flex align-items-center gap-2">
                    <FiPackage size={16} /> Manage Products
                  </Button>
                </Link>
                <Link to="/seller/earnings" className="text-decoration-none">
                  <Button variant="outline-success" className="w-100 text-start d-flex align-items-center gap-2">
                    <FiDollarSign size={16} /> View Earnings
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Recent Orders</h6>
            <Link to="/seller/orders" className="text-decoration-none small d-flex align-items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="table-responsive">
            <Table hover className="mb-0">
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold">#{order.id}</td>
                      <td>{order.customerName || order.user?.name || 'N/A'}</td>
                      <td className="fw-semibold">{formatPrice(order.totalAmount || order.total)}</td>
                      <td>
                        <Badge className={getStatusBadgeClass(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="text-muted">{formatDate(order.createdAt || order.orderDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SellerDashboard;
