import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Table, Badge, Modal } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../redux/slices/couponsSlice";
import { formatDate } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading } = useSelector((state) => state.coupons);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discountPercent: "",
    maxDiscountAmount: "",
    minPurchase: "",
    usageLimit: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      code: "",
      discountPercent: "",
      maxDiscountAmount: "",
      minPurchase: "",
      usageLimit: "",
      validFrom: "",
      validUntil: "",
      isActive: true,
    });
    setEditingCoupon(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      discountPercent: coupon.discountPercent || "",
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      minPurchase: coupon.minPurchase || "",
      usageLimit: coupon.usageLimit || "",
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : "",
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : "",
      isActive: coupon.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      discountPercent: Number(formData.discountPercent),
      maxDiscountAmount: Number(formData.maxDiscountAmount),
      minPurchase: Number(formData.minPurchase),
      usageLimit: Number(formData.usageLimit),
    };

    if (editingCoupon) {
      dispatch(updateCoupon({ id: editingCoupon._id, data: payload }));
    } else {
      dispatch(createCoupon(payload));
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (coupon) => {
    Swal.fire({
      title: "Delete Coupon?",
      text: `Are you sure you want to delete coupon "${coupon.code}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteCoupon(coupon._id));
        Swal.fire("Deleted!", "Coupon has been deleted.", "success");
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Manage Coupons</title>
      </Helmet>

      <Container fluid className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">Manage Coupons</h2>
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleOpenAdd}>
            <FiPlus /> Add Coupon
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Code</th>
                      <th>Discount %</th>
                      <th>Max Discount</th>
                      <th>Min Purchase</th>
                      <th>Usage</th>
                      <th>Validity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No coupons found
                        </td>
                      </tr>
                    ) : (
                      coupons?.map((coupon) => (
                        <tr key={coupon._id}>
                          <td>
                            <code className="bg-light px-2 py-1 rounded fw-bold">
                              {coupon.code}
                            </code>
                          </td>
                          <td className="fw-semibold">{coupon.discountPercent}%</td>
                          <td>{formatDate(coupon.maxDiscountAmount) ? `₹${coupon.maxDiscountAmount}` : `₹${coupon.maxDiscountAmount}`}</td>
                          <td>₹{coupon.minPurchase}</td>
                          <td>
                            <span className="fw-semibold">{coupon.usedCount ?? 0}</span>
                            <span className="text-muted"> / {coupon.usageLimit}</span>
                          </td>
                          <td className="text-muted small">
                            {formatDate(coupon.validFrom)} — {formatDate(coupon.validUntil)}
                          </td>
                          <td>
                            <Badge bg={coupon.isActive ? "success" : "danger"}>
                              {coupon.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenEdit(coupon)}
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(coupon)}
                              >
                                <FiTrash2 />
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
      </Container>

      <Modal
        show={showModal}
        onHide={() => { setShowModal(false); resetForm(); }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Coupon Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    placeholder="e.g. SUMMER20"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Discount Percentage *</Form.Label>
                  <Form.Control
                    type="number"
                    name="discountPercent"
                    placeholder="e.g. 20"
                    min="1"
                    max="100"
                    value={formData.discountPercent}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Max Discount Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxDiscountAmount"
                    placeholder="e.g. 500"
                    min="0"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Min Purchase Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="minPurchase"
                    placeholder="e.g. 1000"
                    min="0"
                    value={formData.minPurchase}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Usage Limit</Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    placeholder="e.g. 100"
                    min="1"
                    value={formData.usageLimit}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Active</Form.Label>
                  <div className="mt-2">
                    <Form.Check
                      type="switch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      label={formData.isActive ? "Active" : "Inactive"}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Valid From *</Form.Label>
                  <Form.Control
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-semibold">Valid Until *</Form.Label>
                  <Form.Control
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCoupon ? "Update Coupon" : "Create Coupon"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default AdminCoupons;
