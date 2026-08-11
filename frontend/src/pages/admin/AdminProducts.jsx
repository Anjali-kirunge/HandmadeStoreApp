import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Table, Badge, Dropdown } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiStar, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { fetchProducts, toggleFeatured, deleteProduct } from "../../redux/slices/productsSlice";
import { fetchCategories } from "../../redux/slices/categoriesSlice";
import { formatPrice } from "../../utils/helpers";
import { PRODUCT_STATUSES } from "../../utils/constants";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { products, totalPages, loading } = useSelector((state) => state.products);
  const pagination = totalPages > 0 ? { totalPages } : null;
  const { categories } = useSelector((state) => state.categories);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      page: currentPage,
      search,
      category: categoryFilter,
      status: statusFilter,
    };
    if (featuredFilter !== "") params.featured = featuredFilter;
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, search, categoryFilter, statusFilter, featuredFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleFeaturedFilter = (e) => {
    setFeaturedFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleFeatured = (productId) => {
    dispatch(toggleFeatured(productId));
  };

  const handleDelete = (product) => {
    Swal.fire({
      title: "Delete Product?",
      text: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProduct(product._id));
        Swal.fire("Deleted!", "Product has been deleted.", "success");
      }
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      active: "success",
      draft: "warning",
      out_of_stock: "danger",
      archived: "secondary",
    };
    return map[status?.toLowerCase()] || "secondary";
  };

  return (
    <>
      <Helmet>
        <title>Manage Products</title>
      </Helmet>

      <Container fluid className="py-4">
        <h2 className="mb-4 fw-bold">Manage Products</h2>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Category</Form.Label>
                <Form.Select value={categoryFilter} onChange={handleCategoryFilter}>
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Status</Form.Label>
                <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="">All Status</option>
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Featured</Form.Label>
                <Form.Select value={featuredFilter} onChange={handleFeaturedFilter}>
                  <option value="">All</option>
                  <option value="true">Featured</option>
                  <option value="false">Not Featured</option>
                </Form.Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>Image</th>
                      <th>Name</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-4">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      products?.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <img
                              src={product.imageUrl || product.images?.[0] || "https://placehold.co/600x400/EEE/999?text=No+Image"}
                              alt={product.name}
                              className="rounded"
                              width={50}
                              height={50}
                              style={{ objectFit: "cover" }}
                            />
                          </td>
                          <td className="fw-semibold">{product.name}</td>
                          <td className="text-muted">{product.seller?.name || "—"}</td>
                          <td>{product.category?.name || "—"}</td>
                          <td className="fw-semibold">{formatPrice(product.price)}</td>
                          <td>
                            <span className={product.stock <= 0 ? "text-danger fw-semibold" : ""}>
                              {product.stock}
                            </span>
                          </td>
                          <td>
                            <Badge bg={getStatusBadge(product.status)}>
                              {product.status?.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="link"
                              className="p-0"
                              onClick={() => handleToggleFeatured(product._id, product.featured)}
                              title={product.featured ? "Remove from featured" : "Mark as featured"}
                            >
                              {product.featured ? (
                                <FiStar size={20} className="text-warning" fill="#eab308" />
                              ) : (
                                <FiStar size={20} className="text-muted" />
                              )}
                            </Button>
                          </td>
                          <td>
                            <span className="text-warning">★</span>{" "}
                            {product.rating?.toFixed(1) ?? "0.0"}
                          </td>
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle variant="outline-secondary" size="sm" id={`actions-${product._id}`}>
                                Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleToggleFeatured(product._id, product.featured)}>
                                  {product.featured ? (
                                    <>
                                      <FiStar className="me-2" /> Remove Featured
                                    </>
                                  ) : (
                                    <>
                                      <FiStar className="me-2" /> Mark Featured
                                    </>
                                  )}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => handleDelete(product)}
                                >
                                  <FiTrash2 className="me-2" /> Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
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
    </>
  );
};

export default AdminProducts;
