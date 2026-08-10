import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge, Table, Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchOrderById, cancelOrder } from '../../redux/slices/ordersSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, formatDate, getStatusBadgeClass } from '../../utils/helpers';

const statusSteps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, loading } = useSelector((state) => state.orders);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  const handleCancelOrder = () => {
    dispatch(cancelOrder(id))
      .unwrap()
      .then(() => {
        toast.success('Order cancelled successfully');
        setShowCancelModal(false);
      })
      .catch((err) => toast.error(err || 'Failed to cancel order'));
  };

  if (loading || !order) return <LoadingSpinner />;

  const currentStepIndex = statusSteps.indexOf(order.orderStatus || order.status);
  const canCancel = (order.orderStatus || order.status) === 'PENDING' || (order.orderStatus || order.status) === 'CONFIRMED';
  const shippingCost = order.shippingCost || 0;
  const discount = order.discount || order.discountAmount || 0;

  return (
    <>
      <Helmet>
        <title>Order Details - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <Link to="/orders" className="text-decoration-none mb-3 d-inline-block" style={{ color: 'var(--text-primary)' }}>
          <FiArrowLeft className="me-1" /> Back to Orders
        </Link>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Order #{order.id || order.orderId}
            </h3>
            <span className="text-muted">
              Placed on {formatDate(order.createdAt || order.orderDate || order.date)}
            </span>
          </div>
          <Badge className={getStatusBadgeClass(order.orderStatus || order.status)} style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
            {(order.orderStatus || order.status || 'PENDING').replace('_', ' ')}
          </Badge>
        </div>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h6 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Order Progress
            </h6>
            <div className="d-flex justify-content-between position-relative mb-2">
              <div
                className="position-absolute top-0"
                style={{
                  left: '5%',
                  right: '5%',
                  height: '4px',
                  backgroundColor: 'var(--border-color)',
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${currentStepIndex >= 0 ? Math.min(100, (currentStepIndex / (statusSteps.length - 1)) * 100) : 0}%`,
                    backgroundColor: 'var(--success)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} className="text-center position-relative" style={{ zIndex: 1, flex: 1 }}>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: isCompleted ? 'var(--success)' : 'var(--border-color)',
                        color: isCompleted ? '#fff' : 'var(--text-muted)',
                        border: isCurrent ? '3px solid var(--card-bg)' : 'none',
                        boxShadow: isCurrent ? '0 0 0 3px var(--success)' : 'none',
                      }}
                    >
                      {isCompleted ? <FiCheck size={18} /> : index + 1}
                    </div>
                    <small
                      className="fw-semibold d-block"
                      style={{
                        color: isCompleted ? 'var(--success)' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                      }}
                    >
                      {step.replace('_', ' ')}
                    </small>
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>

        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Order Items
                </h5>
              </Card.Header>
              <div className="table-responsive">
                <Table className="mb-0 align-middle">
                  <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || order.orderItems || []).map((item, index) => {
                      const productName = item.productName || item.product?.name || item.name;
                      const productImage = item.product?.imageUrl || item.imageUrl;
                      const itemPrice = item.price || item.product?.price || 0;
                      const itemQuantity = item.quantity || 1;
                      const productId = item.productId || item.product?.id;
                      return (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                  className="me-3"
                                />
                              ) : (
                                <div
                                  className="me-3 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '4px',
                                  }}
                                >
                                  📦
                                </div>
                              )}
                              <div>
                                {productId ? (
                                  <Link
                                    to={`/product/${productId}`}
                                    className="text-decoration-none fw-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {productName}
                                  </Link>
                                ) : (
                                  <span className="fw-semibold">{productName}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">{itemQuantity}</td>
                          <td className="text-end">{formatPrice(itemPrice)}</td>
                          <td className="text-end fw-semibold">{formatPrice(itemPrice * itemQuantity)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Shipping Address
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-0" style={{ lineHeight: '1.8' }}>
                  {order.shippingAddress || 'No shipping address available'}
                </p>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Payment Info
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Method</span>
                  <span className="fw-semibold">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Status</span>
                  <Badge
                    bg={
                      order.paymentStatus === 'COMPLETED'
                        ? 'success'
                        : order.paymentStatus === 'FAILED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {order.paymentStatus || 'PENDING'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Order Summary
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(order.subtotal || order.totalAmount || order.total)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Shipping</span>
                  <span>{shippingCost === 0 ? <span style={{ color: 'var(--price-color)' }}>FREE</span> : formatPrice(shippingCost)}</span>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Discount</span>
                    <span style={{ color: 'var(--price-color)' }}>-{formatPrice(discount)}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fs-5 fw-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span className="fs-5 fw-bold" style={{ color: 'var(--price-color)' }}>
                    {formatPrice(order.grandTotal || order.totalAmount || order.total)}
                  </span>
                </div>

                {canCancel && (
                  <Button
                    variant="outline-danger"
                    className="w-100 mt-3"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Order
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel order <strong>#{order.id || order.orderId}</strong>?</p>
          <p className="text-muted mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowCancelModal(false)}>
            Keep Order
          </Button>
          <Button variant="danger" onClick={handleCancelOrder}>
            Yes, Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderDetailPage;
