import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Table, Badge, Modal, Tabs, Tab } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiEye, FiEdit2 } from "react-icons/fi";
import { fetchAllOrders, updateOrderStatus, fetchOrdersByStatus } from "../../redux/slices/adminSlice";
import { ORDER_STATUSES } from "../../utils/constants";
import { formatPrice, formatDate, getStatusBadgeClass } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const STATUS_TABS = ["all", ...ORDER_STATUSES];

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { orders, totalPages, loading } = useSelector((state) => state.admin);
  const ordersPagination = totalPages > 0 ? { totalPages } : null;

  const [activeTab, setActiveTab] = useState("all");
  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  useEffect(() => {
    if (activeTab === "all") {
      dispatch(fetchAllOrders({ page: currentPage, search: searchId }));
    } else {
      dispatch(fetchOrdersByStatus({ status: activeTab, page: currentPage }));
    }
  }, [dispatch, currentPage, activeTab, searchId]);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchId(e.target.value);
    setCurrentPage(1);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setNotes(order.notes || "");
    setShowStatusModal(true);
  };

  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus) {
      dispatch(
        updateOrderStatus({
          id: selectedOrder._id,
          data: { status: newStatus, trackingNumber, notes },
        })
      );
      setShowStatusModal(false);
      setSelectedOrder(null);
    }
  };

  const openDetailModal = (order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <>
      <Helmet>
        <title>Manage Orders</title>
      </Helmet>

      <Container fluid className="py-4">
        <h2 className="mb-4 fw-bold">Manage Orders</h2>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <Form.Label className="fw-semibold">Search by Order ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter order ID..."
                  value={searchId}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabSelect}
              className="mb-3"
              fill
            >
              {STATUS_TABS.map((status) => (
                <Tab
                  key={status}
                  eventKey={status}
                  title={
                    <span className="text-capitalize">
                      {status === "all" ? "All Orders" : formatStatus(status)}
                    </span>
                  }
                />
              ))}
            </Tabs>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders?.map((order) => (
                        <tr key={order._id}>
                          <td className="fw-semibold">#{order._id?.slice(-8).toUpperCase()}</td>
                          <td>{order.user?.name ?? "N/A"}</td>
                          <td>{order.items?.length ?? 0}</td>
                          <td className="fw-semibold">{formatPrice(order.totalAmount)}</td>
                          <td>
                            <Badge bg={order.paymentStatus === "paid" ? "success" : "warning"}>
                              {order.paymentStatus || "pending"}
                            </Badge>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                              {formatStatus(order.status)}
                            </span>
                          </td>
                          <td className="text-muted">{formatDate(order.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => openDetailModal(order)}
                                title="View Details"
                              >
                                <FiEye />
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openStatusModal(order)}
                                title="Update Status"
                              >
                                <FiEdit2 />
                              </Button>
                            </div>
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

        {ordersPagination && ordersPagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={ordersPagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Container>

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Order <strong>#{selectedOrder?._id?.slice(-8).toUpperCase()}</strong>
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">New Status *</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tracking Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Order Details — #{detailOrder?._id?.slice(-8).toUpperCase()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailOrder && (
            <>
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="fw-bold text-muted">Customer Info</h6>
                  <p className="mb-1"><strong>Name:</strong> {detailOrder.user?.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {detailOrder.user?.email}</p>
                  <p className="mb-1"><strong>Phone:</strong> {detailOrder.user?.phone || "N/A"}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold text-muted">Order Info</h6>
                  <p className="mb-1">
                    <strong>Status:</strong>{" "}
                    <span className={`badge ${getStatusBadgeClass(detailOrder.status)}`}>
                      {formatStatus(detailOrder.status)}
                    </span>
                  </p>
                  <p className="mb-1">
                    <strong>Payment:</strong>{" "}
                    <Badge bg={detailOrder.paymentStatus === "paid" ? "success" : "warning"}>
                      {detailOrder.paymentStatus}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(detailOrder.createdAt)}
                  </p>
                </div>
              </div>

              {detailOrder.shippingAddress && (
                <div className="mb-4">
                  <h6 className="fw-bold text-muted">Shipping Address</h6>
                  <p className="mb-0">
                    {detailOrder.shippingAddress.street}, {detailOrder.shippingAddress.city},{" "}
                    {detailOrder.shippingAddress.state} — {detailOrder.shippingAddress.pincode}
                  </p>
                </div>
              )}

              <h6 className="fw-bold text-muted mb-3">Items</h6>
              <div className="table-responsive">
                <Table size="sm" className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product?.name || item.name || "N/A"}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price)}</td>
                        <td className="fw-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="text-end mt-3">
                <h5 className="fw-bold">
                  Total: {formatPrice(detailOrder.totalAmount)}
                </h5>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminOrders;
