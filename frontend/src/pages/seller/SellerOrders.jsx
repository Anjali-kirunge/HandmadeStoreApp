import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { Container, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { fetchSellerOrders, updateSellerOrderStatus } from '../../redux/slices/sellerSlice';
import { formatPrice, formatDate, getStatusBadgeClass } from '../../utils/helpers';
import { ORDER_STATUSES, ITEMS_PER_PAGE } from '../../utils/constants';
import Pagination from '../../components/common/Pagination';

const OrdersSkeleton = () => (
  <div>
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} height={60} className="mb-2 rounded" />
    ))}
  </div>
);

const SellerOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading, totalPages, currentPage } = useSelector((state) => state.seller);

  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const params = { page, size: ITEMS_PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    dispatch(fetchSellerOrders(params));
  }, [dispatch, page, statusFilter, dateFrom, dateTo]);

  const handleUpdateClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || '');
    setTrackingNumber(order.trackingNumber || '');
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      await dispatch(
        updateSellerOrderStatus({
          id: selectedOrder.id,
          data: { status: newStatus, trackingNumber: trackingNumber || undefined },
        })
      ).unwrap();
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Container fluid>
      <Helmet>
        <title>Seller Orders - Handmade Store</title>
      </Helmet>

      <div className="mb-4">
        <h4 className="fw-bold">Orders</h4>
        <p className="text-muted mb-0">Manage and fulfill your orders</p>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <Form.Label className="small text-muted">Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Status</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Label className="small text-muted">From Date</Form.Label>
              <Form.Control
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="col-md-3">
              <Form.Label className="small text-muted">To Date</Form.Label>
              <Form.Control
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="col-md-3">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => {
                  setStatusFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(0);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-3">
              <OrdersSkeleton />
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Order Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-5">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className="fw-semibold">#{order.id}</td>
                        <td>{order.customerName || order.user?.name || 'N/A'}</td>
                        <td>{order.items?.length || order.itemCount || 0}</td>
                        <td className="fw-semibold">{formatPrice(order.totalAmount || order.total)}</td>
                        <td>
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {order.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="text-muted">{formatDate(order.createdAt || order.orderDate)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleUpdateClick(order)}
                          >
                            Update Status
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Order #{selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Order Status</Form.Label>
            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-semibold">Tracking Number</Form.Label>
            <Form.Control
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handleStatusUpdate} disabled={updating || !newStatus}>
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SellerOrders;
