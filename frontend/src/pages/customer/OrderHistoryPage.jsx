import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiPackage, FiEye } from 'react-icons/fi';
import { fetchOrders } from '../../redux/slices/ordersSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { formatPrice, formatDate, getStatusBadgeClass } from '../../utils/helpers';
import { ITEMS_PER_PAGE } from '../../utils/constants';

const statusFilters = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const OrderHistoryPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, totalPages, currentPage, totalElements } = useSelector(
    (state) => state.orders
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(0);

  useEffect(() => {
    const params = { page: currentPageNum, size: ITEMS_PER_PAGE };
    if (statusFilter !== 'ALL') params.status = statusFilter;
    dispatch(fetchOrders(params));
  }, [dispatch, currentPageNum, statusFilter]);

  const handlePageChange = (page) => {
    setCurrentPageNum(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPageNum(0);
  };

  if (loading && orders.length === 0) return <LoadingSpinner />;

  return (
    <>
      <Helmet>
        <title>My Orders - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          My Orders
        </h2>

        <div className="d-flex flex-wrap gap-2 mb-4">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'dark' : 'outline-dark'}
              size="sm"
              onClick={() => handleStatusFilter(status)}
              className="fw-semibold"
            >
              {status === 'ALL' ? 'All Orders' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {orders && orders.length > 0 ? (
          <>
            {orders.map((order) => (
              <Card key={order.id} className="border-0 shadow-sm mb-3">
                <Card.Body className="p-4">
                  <Row className="align-items-center">
                    <Col md={3}>
                      <small className="text-muted d-block">Order ID</small>
                      <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                        #{order.id || order.orderId}
                      </span>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Date</small>
                      <span>{formatDate(order.createdAt || order.orderDate || order.date)}</span>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Status</small>
                      <Badge className={getStatusBadgeClass(order.orderStatus || order.status)}>
                        {(order.orderStatus || order.status || 'PENDING').replace('_', ' ')}
                      </Badge>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Items</small>
                      <span>{order.totalItems || order.items?.length || 0} item(s)</span>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Total</small>
                      <span className="fw-bold" style={{ color: 'var(--price-color)' }}>
                        {formatPrice(order.totalAmount || order.total || order.grandTotal)}
                      </span>
                    </Col>
                    <Col md={1} className="text-end">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline-dark" size="sm">
                          <FiEye /> Details
                        </Button>
                      </Link>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <FiPackage size={60} className="text-muted mb-3" />
            <h4 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
              No orders found
            </h4>
            <p className="text-muted mb-3">
              {statusFilter !== 'ALL'
                ? `You have no ${statusFilter.toLowerCase().replace('_', ' ')} orders.`
                : "You haven't placed any orders yet."}
            </p>
            <Link to="/shop">
              <Button style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}>
                Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </>
  );
};

export default OrderHistoryPage;
