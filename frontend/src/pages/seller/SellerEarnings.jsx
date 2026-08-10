import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
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
import { formatPrice, formatDate } from '../../utils/helpers';

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

const EarningsSkeleton = () => (
  <div>
    <Skeleton height={32} width={200} className="mb-4" />
    <Row className="g-3 mb-4">
      {[1, 2, 3, 4].map((i) => (
        <Col xs={12} sm={6} lg={3} key={i}>
          <Skeleton height={100} className="rounded" />
        </Col>
      ))}
    </Row>
    <Skeleton height={350} className="rounded mb-4" />
    <Skeleton height={200} className="rounded" />
  </div>
);

const SellerEarnings = () => {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.seller);

  useEffect(() => {
    dispatch(fetchSellerDashboard());
  }, [dispatch]);

  if (loading && !dashboard) {
    return (
      <Container fluid>
        <Helmet>
          <title>Earnings - Handmade Store</title>
        </Helmet>
        <EarningsSkeleton />
      </Container>
    );
  }

  const totalEarnings = dashboard?.totalRevenue ?? dashboard?.totalEarnings ?? 0;
  const thisMonth = dashboard?.thisMonthRevenue ?? dashboard?.currentMonthEarnings ?? 0;
  const thisWeek = dashboard?.thisWeekRevenue ?? dashboard?.currentWeekEarnings ?? 0;
  const totalOrders = dashboard?.totalOrders ?? 0;
  const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

  const monthlyEarnings = dashboard?.monthlyEarnings || dashboard?.monthlyRevenue || [];

  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData = months.map((month, index) => {
    const found = monthlyEarnings.find((item) => {
      const itemMonth = item.month || item.label || '';
      const itemIndex = months.findIndex((m) => m.toLowerCase() === itemMonth.toLowerCase().slice(0, 3));
      return itemIndex === index;
    });
    return found ? found.amount || found.revenue || found.earnings || 0 : 0;
  });

  const chartData = {
    labels: months.map((m) => `${m} ${currentYear}`),
    datasets: [
      {
        label: 'Earnings',
        data: monthlyData,
        backgroundColor: 'rgba(255, 153, 0, 0.8)',
        borderColor: '#FF9900',
        borderWidth: 1,
        borderRadius: 4,
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
          label: (ctx) => `Earnings: ${formatPrice(ctx.parsed.y)}`,
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

  const recentPayments = dashboard?.recentPayments || dashboard?.paymentHistory || [];

  return (
    <Container fluid>
      <Helmet>
        <title>Earnings - Handmade Store</title>
      </Helmet>

      <div className="mb-4">
        <h4 className="fw-bold">Earnings</h4>
        <p className="text-muted mb-0">Track your revenue and payout information</p>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Total Earnings" value={formatPrice(totalEarnings)} icon={FiDollarSign} color="#067D62" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="This Month" value={formatPrice(thisMonth)} icon={FiCalendar} color="#FF9900" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="This Week" value={formatPrice(thisWeek)} icon={FiTrendingUp} color="#146EB4" />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard title="Avg Order Value" value={formatPrice(averageOrderValue)} icon={FiBarChart2} color="#E47911" />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <h6 className="fw-bold mb-3">Monthly Earnings - {currentYear}</h6>
          <div style={{ height: 350 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </Card.Body>
      </Card>

      {recentPayments.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <h6 className="fw-bold mb-3">Recent Payments</h6>
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Payment ID</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td className="fw-semibold">#{payment.id || `PAY-${index + 1}`}</td>
                      <td>#{payment.orderId || payment.order?.id || 'N/A'}</td>
                      <td className="fw-semibold">{formatPrice(payment.amount)}</td>
                      <td className="text-muted">{formatDate(payment.createdAt || payment.date)}</td>
                      <td>
                        <span className={`badge ${payment.status === 'COMPLETED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {payment.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h6 className="fw-bold mb-3">Payout Information</h6>
          <Row className="g-3">
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <p className="text-muted small mb-1">Bank Account</p>
                <p className="fw-semibold mb-0">
                  {dashboard?.bankAccountNumber
                    ? `****${dashboard.bankAccountNumber.slice(-4)}`
                    : 'Not configured'}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <p className="text-muted small mb-1">Bank Name</p>
                <p className="fw-semibold mb-0">
                  {dashboard?.bankName || 'Not configured'}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <p className="text-muted small mb-1">IFSC Code</p>
                <p className="fw-semibold mb-0">
                  {dashboard?.ifscCode || 'Not configured'}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <p className="text-muted small mb-1">Next Payout</p>
                <p className="fw-semibold mb-0">
                  {dashboard?.nextPayoutDate
                    ? formatDate(dashboard.nextPayoutDate)
                    : 'Pending'}
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SellerEarnings;
