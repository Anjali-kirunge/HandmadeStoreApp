import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { fetchSellerProducts } from '../../redux/slices/sellerSlice';
import { deleteProduct } from '../../redux/slices/productsSlice';
import { formatPrice, getStatusBadgeClass } from '../../utils/helpers';
import { PRODUCT_STATUSES, ITEMS_PER_PAGE } from '../../utils/constants';
import Pagination from '../../components/common/Pagination';

const ProductsSkeleton = () => (
  <div>
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} height={60} className="mb-2 rounded" />
    ))}
  </div>
);

const SellerProducts = () => {
  const dispatch = useDispatch();
  const { products, loading, totalPages, currentPage } = useSelector((state) => state.seller);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const params = { page, size: ITEMS_PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    if (sortBy === 'newest') params.sort = 'createdAt,desc';
    else if (sortBy === 'oldest') params.sort = 'createdAt,asc';
    else if (sortBy === 'price_low') params.sort = 'price,asc';
    else if (sortBy === 'price_high') params.sort = 'price,desc';
    else if (sortBy === 'name') params.sort = 'name,asc';

    dispatch(fetchSellerProducts(params));
  }, [dispatch, page, statusFilter, sortBy, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    const params = { page: 0, size: ITEMS_PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();
    dispatch(fetchSellerProducts(params));
  };

  const handleDeleteClick = (product) => {
    setDeleteTarget(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteProduct(deleteTarget.id)).unwrap();
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      dispatch(fetchSellerProducts({ page, size: ITEMS_PER_PAGE }));
    } catch (err) {
      toast.error(err || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container fluid>
      <Helmet>
        <title>My Products - Handmade Store</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">My Products</h4>
        <Link to="/seller/products/add">
          <Button variant="warning" className="d-flex align-items-center gap-2">
            <FiPlus size={16} /> Add New Product
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label className="small text-muted">Search</Form.Label>
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <FiSearch size={16} />
                  </Button>
                </div>
              </form>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Status</option>
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Sort By</Form.Label>
              <Form.Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-3">
              <ProductsSkeleton />
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5">
                        No products found. <Link to="/seller/products/add">Add your first product</Link>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img
                            src={product.imageUrl || product.images?.[0] || 'https://placehold.co/600x400/EEE/999?text=No+Image'}
                            alt={product.name}
                            className="rounded"
                            style={{ width: 48, height: 48, objectFit: 'cover' }}
                          />
                        </td>
                        <td className="fw-semibold">{product.name}</td>
                        <td>
                          <span className="text-muted">
                            {product.category?.name || product.categoryName || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold">{formatPrice(product.price)}</span>
                          {product.discountPrice > 0 && (
                            <span className="text-muted ms-2 text-decoration-line-through small">
                              {formatPrice(product.discountPrice)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={product.stockQuantity <= 0 ? 'text-danger fw-semibold' : ''}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td>
                          <Badge className={getStatusBadgeClass(product.status)}>
                            {product.status?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td>
                          {product.averageRating ? (
                            <span>
                              {'★'.repeat(Math.round(product.averageRating))}
                              {'☆'.repeat(5 - Math.round(product.averageRating))}
                              <span className="ms-1 text-muted small">({product.averageRating})</span>
                            </span>
                          ) : (
                            <span className="text-muted">No ratings</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link to={`/seller/products/edit/${product.id}`}>
                              <Button variant="outline-primary" size="sm" title="Edit">
                                <FiEdit2 size={14} />
                              </Button>
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <FiTrash2 size={14} />
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

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SellerProducts;
