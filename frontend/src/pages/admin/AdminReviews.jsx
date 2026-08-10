import React, { useEffect, useState } from "react";
import { Container, Card, Button, Table, Modal } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiTrash2, FiEye } from "react-icons/fi";
import Swal from "sweetalert2";
import { fetchAllReviews } from "../../redux/slices/adminSlice";
import { deleteReview } from "../../redux/slices/reviewsSlice";
import { formatDate } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const AdminReviews = () => {
  const dispatch = useDispatch();
  const { reviews, totalPages, loading } = useSelector((state) => state.admin);
  const pagination = totalPages > 0 ? { totalPages } : null;

  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    dispatch(fetchAllReviews({ page: currentPage }));
  }, [dispatch, currentPage]);

  const handleDelete = (review) => {
    Swal.fire({
      title: "Delete Review?",
      text: "Are you sure you want to delete this review? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteReview(review._id));
        Swal.fire("Deleted!", "Review has been deleted.", "success");
      }
    });
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    return (
      <span>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? "text-warning" : "text-muted"}>
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>Manage Reviews</title>
      </Helmet>

      <Container fluid className="py-4">
        <h2 className="mb-4 fw-bold">Manage Reviews</h2>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Product</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No reviews found
                        </td>
                      </tr>
                    ) : (
                      reviews?.map((review) => (
                        <tr key={review._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={
                                  review.user?.avatar ||
                                  `https://ui-avatars.com/api/?name=${review.user?.name}&background=random`
                                }
                                alt={review.user?.name}
                                className="rounded-circle"
                                width={32}
                                height={32}
                              />
                              <span className="fw-semibold">{review.user?.name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="text-truncate" style={{ maxWidth: 200 }}>
                            {review.product?.name || "Deleted Product"}
                          </td>
                          <td>{renderStars(review.rating)}</td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: 250 }}>
                              {review.comment || "—"}
                            </span>
                          </td>
                          <td className="text-muted">{formatDate(review.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => openDetailModal(review)}
                                title="View Full Review"
                              >
                                <FiEye />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(review)}
                                title="Delete Review"
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

        {pagination && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Container>

      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Review Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <>
              <div className="d-flex align-items-center gap-3 mb-4">
                <img
                  src={
                    selectedReview.user?.avatar ||
                    `https://ui-avatars.com/api/?name=${selectedReview.user?.name}&background=random`
                  }
                  alt={selectedReview.user?.name}
                  className="rounded-circle"
                  width={48}
                  height={48}
                />
                <div>
                  <h6 className="fw-bold mb-0">{selectedReview.user?.name}</h6>
                  <small className="text-muted">{formatDate(selectedReview.createdAt)}</small>
                </div>
              </div>

              <div className="mb-3">
                <strong>Product:</strong> {selectedReview.product?.name || "Deleted Product"}
              </div>

              <div className="mb-3">
                <strong>Rating:</strong> {renderStars(selectedReview.rating)}
                <span className="ms-2 text-muted">({selectedReview.rating}/5)</span>
              </div>

              <div>
                <strong>Comment:</strong>
                <p className="mt-2 p-3 bg-light rounded mb-0">
                  {selectedReview.comment || "No comment provided."}
                </p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              handleDelete(selectedReview);
              setShowDetailModal(false);
            }}
          >
            <FiTrash2 className="me-1" /> Delete Review
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminReviews;
