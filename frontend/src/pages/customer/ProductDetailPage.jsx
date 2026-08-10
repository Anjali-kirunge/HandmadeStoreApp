import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Button, Form, Badge, Tabs, Tab, Modal, Table } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiHeart, FiShoppingCart, FiStar, FiTruck, FiShield, FiRefreshCw, FiZoomIn } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchProductById } from '../../redux/slices/productsSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import { addToWishlist } from '../../redux/slices/wishlistSlice';
import { fetchReviewsByProduct, addReview, canReview } from '../../redux/slices/reviewsSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ProductCard from '../../components/product/ProductCard';
import { formatPrice, formatDate, generateStars, getDiscountedPrice, truncateText } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';

const ReviewForm = ({ productId, onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.reviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addReview({ productId, data: { rating, comment } }))
      .unwrap()
      .then(() => {
        toast.success('Review submitted successfully!');
        onClose();
      })
      .catch((err) => toast.error(err || 'Failed to submit review'));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Your Rating</Form.Label>
        <div>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{
                cursor: 'pointer',
                fontSize: '2rem',
                color: star <= rating ? 'var(--accent)' : 'var(--border-strong)',
                transition: 'color var(--transition-fast), transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            >
              ★
            </span>
          ))}
        </div>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Your Review</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          placeholder="Share your experience with this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </Form.Group>
      <div className="d-flex gap-2">
        <Button type="submit" variant="brand" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const { product, loading: productLoading, error } = useSelector((state) => state.products);
  const { reviews, loading: reviewsLoading, totalPages: reviewPages, canReview: canReviewProduct } = useSelector(
    (state) => state.reviews
  );
  const cartItems = useSelector((state) => state.cart.items);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchReviewsByProduct({ productId: id, page: reviewPage, size: 5 }));
      if (isAuthenticated) {
        dispatch(canReview(id));
      }
    }
  }, [id, dispatch, reviewPage, isAuthenticated]);

  const isInCart = cartItems.some((item) => (item.productId || item.product?.id || item.id) === Number(id));

  const handleAddToCart = () => {
    if (isInCart) {
      navigate('/cart');
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity }))
      .unwrap()
      .then(() => toast.success('Added to cart!'))
      .catch((err) => toast.error(err || 'Failed to add to cart'));
  };

  const handleAddToWishlist = () => {
    dispatch(addToWishlist({ productId: product.id }))
      .unwrap()
      .then(() => toast.success('Added to wishlist!'))
      .catch((err) => toast.error(err || 'Failed to add to wishlist'));
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ productId: product.id, quantity }))
      .unwrap()
      .then(() => navigate('/checkout'))
      .catch((err) => toast.error(err || 'Failed to add to cart'));
  };

  if (productLoading) {
    return <LoadingSpinner />;
  }

  if (error && !product) {
    return (
      <Container className="py-5 text-center">
        <div className="empty-state mx-auto" style={{ maxWidth: 480 }}>
          <div className="empty-icon">⚠️</div>
          <h3 className="fw-bold mb-2">Something went wrong</h3>
          <p className="text-muted mb-4">{error || 'Failed to load product. Please try again.'}</p>
          <Button variant="brand" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <div className="empty-state mx-auto" style={{ maxWidth: 480 }}>
          <div className="empty-icon">📦</div>
          <h3 className="fw-bold mb-2">Product not found</h3>
          <p className="text-muted mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="brand" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </Container>
    );
  }

  const stars = generateStars(product.rating || product.averageRating || 0);
  const discountedPrice = product.discountPrice || product.discountedPrice;
  const hasDiscount = discountedPrice && discountedPrice < product.price;
  const savingsPercent = hasDiscount ? getDiscountedPrice(product.price, discountedPrice) : 0;
  const inStock = product.stockQuantity > 0 || product.quantityInStock > 0;
  const stockQty = product.stockQuantity || product.quantityInStock || 0;
  const images = (product.images && product.images.length > 0) ? product.images : (product.imageUrl ? [product.imageUrl] : []);
  const relatedProducts = product.relatedProducts || product.category?.products || [];

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (product.rating || product.averageRating || 0).toFixed(1);

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const currentImage = images[selectedImage] || images[0];

  return (
    <>
      <Helmet>
        <title>{product.name} - Handmade Store</title>
      </Helmet>

      <Container fluid="lg" className="py-4">
        <nav className="breadcrumb-custom mb-4" aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            {product.category && (
              <li className="breadcrumb-item">
                <Link to={`/shop?categoryId=${product.category.id}`}>{product.category.name}</Link>
              </li>
            )}
            <li className="breadcrumb-item active">{truncateText(product.name, 40)}</li>
          </ol>
        </nav>

        <Row className="g-4 mb-5">
          {/* Gallery */}
          <Col lg={6} xl={5}>
            <div className="gallery-main">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <span style={{ fontSize: '5rem' }}>📦</span>
              )}
              {images.length > 1 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: 'rgba(23,23,23,0.7)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <FiZoomIn size={13} /> Hover to zoom
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`gallery-thumb ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </Col>

          {/* Info + buy box */}
          <Col lg={6} xl={7}>
            <h2 className="mb-2">{product.name}</h2>

            <div className="d-flex align-items-center mb-3 gap-2">
              <span className="product-rating">
                <FiStar size={13} fill="currentColor" /> {averageRating}
              </span>
              <span className="text-muted small">
                {reviews.length || product.reviewCount || 0} reviews
              </span>
            </div>

            <div className="mb-3 pb-3 border-bottom d-flex align-items-baseline gap-3">
              {hasDiscount ? (
                <>
                  <span className="price price-lg">{formatPrice(discountedPrice)}</span>
                  <span className="price-original" style={{ fontSize: '1.1rem' }}>
                    {formatPrice(product.price)}
                  </span>
                  <Badge bg="danger">{savingsPercent}% off</Badge>
                </>
              ) : (
                <span className="price price-lg">{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="fw-semibold">Availability:</span>
              {inStock ? (
                <Badge bg="success">In Stock</Badge>
              ) : (
                <Badge bg="danger">Out of Stock</Badge>
              )}
              {inStock && stockQty > 0 && (
                <span className="small" style={{ color: stockQty < 5 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {stockQty < 5 ? `Only ${stockQty} left in stock!` : `${stockQty} available`}
                </span>
              )}
            </div>

            <div className="buy-box mb-4">
              <div className="mb-3">
                <span className="fw-semibold me-2">Category:</span>
                <Link
                  to={product.category ? `/shop?categoryId=${product.category.id}` : '/shop'}
                  className="text-decoration-none"
                  style={{ color: 'var(--brand-light)' }}
                >
                  {product.category?.name || 'Uncategorized'}
                </Link>
              </div>

              {inStock && (
                <div className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <div className="quantity-selector">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                    <input
                      type="number"
                      min="1"
                      max={stockQty}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(stockQty, Math.max(1, val)));
                      }}
                    />
                    <button type="button" onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}>+</button>
                  </div>
                </div>
              )}

              <div className="d-grid gap-2">
                <Button
                  variant={isInCart ? "outline-primary" : "accent"}
                  onClick={handleAddToCart}
                  disabled={!inStock && !isInCart}
                  className="py-2 fw-semibold"
                >
                  <FiShoppingCart className="me-2" /> {isInCart ? 'Go to Cart' : 'Add to Cart'}
                </Button>
                <Button
                  variant="brand"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="py-2 fw-semibold"
                >
                  Buy Now
                </Button>
              </div>

              <div className="d-flex gap-3 mt-3 pt-3 border-top small" style={{ color: 'var(--text-secondary)' }}>
                <span className="d-flex align-items-center gap-1">
                  <FiTruck style={{ color: 'var(--success)' }} /> Free shipping
                </span>
                <span className="d-flex align-items-center gap-1">
                  <FiRefreshCw style={{ color: 'var(--info)' }} /> Easy returns
                </span>
                <span className="d-flex align-items-center gap-1">
                  <FiShield style={{ color: 'var(--brand-light)' }} /> Secure payment
                </span>
              </div>

              <Button
                variant="outline-danger"
                className="w-100 mt-3"
                onClick={handleAddToWishlist}
              >
                <FiHeart className="me-2" /> Add to Wishlist
              </Button>

              {product.seller && (
                <div className="p-3 rounded-3 mt-3" style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border-color)' }}>
                  <span className="text-muted me-2">Sold by:</span>
                  <span className="fw-semibold">
                    {product.seller.firstName || product.seller.name
                      ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim()
                      : 'Unknown Seller'}
                  </span>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Tabs defaultActiveKey="description" className="mb-4">
          <Tab eventKey="description" title="Description">
            <div className="card p-4">
              <h5 className="fw-bold mb-3">Product Description</h5>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                {product.description || 'No description available for this product.'}
              </p>
            </div>
          </Tab>

          <Tab eventKey="specifications" title="Specifications">
            <div className="card p-4">
              <h5 className="fw-bold mb-3">Product Details</h5>
              <div className="table-responsive">
                <Table bordered className="table-custom mb-0" size="sm">
                  <tbody>
                    <tr>
                      <td className="fw-semibold" style={{ width: '200px' }}>Name</td>
                      <td>{product.name}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Category</td>
                      <td>{product.category?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Price</td>
                      <td>{formatPrice(product.price)}</td>
                    </tr>
                    {product.weight && (
                      <tr>
                        <td className="fw-semibold">Weight</td>
                        <td>{product.weight}</td>
                      </tr>
                    )}
                    {product.dimensions && (
                      <tr>
                        <td className="fw-semibold">Dimensions</td>
                        <td>{product.dimensions}</td>
                      </tr>
                    )}
                    {product.material && (
                      <tr>
                        <td className="fw-semibold">Material</td>
                        <td>{product.material}</td>
                      </tr>
                    )}
                    {product.color && (
                      <tr>
                        <td className="fw-semibold">Color</td>
                        <td>{product.color}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Tab>

          <Tab eventKey="reviews" title={`Reviews (${reviews.length || product.reviewCount || 0})`}>
            <div className="card p-4">
              <Row>
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="review-summary-card p-4 text-center">
                    <h1 className="fw-bold mb-1" style={{ color: 'var(--brand-light)' }}>
                      {averageRating}
                    </h1>
                    <div className="mb-2">
                      {generateStars(parseFloat(averageRating)).map((s, i) => (
                        <span key={i} style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>
                          {s === 'full' ? '★' : s === 'half' ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <small className="text-muted">
                      Based on {reviews.length || product.reviewCount || 0} reviews
                    </small>
                  </div>

                  <div className="mt-3">
                    {ratingCounts.map(({ star, count }) => (
                      <div key={star} className="d-flex align-items-center mb-1 gap-2">
                        <span className="small" style={{ minWidth: '40px' }}>{star} ★</span>
                        <div className="rating-bar-track flex-grow-1">
                          <div
                            className="rating-bar-fill"
                            style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                          />
                        </div>
                        <small className="text-muted" style={{ minWidth: '20px' }}>{count}</small>
                      </div>
                    ))}
                  </div>
                </Col>

                <Col md={8}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Customer Reviews</h5>
                    {isAuthenticated && canReviewProduct && (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => setShowReviewForm(true)}
                      >
                        <FiStar className="me-1" /> Write a Review
                      </Button>
                    )}
                  </div>

                  {reviewsLoading ? (
                    <LoadingSpinner />
                  ) : reviews.length > 0 ? (
                    <>
                      {reviews.map((review) => (
                        <div key={review.id} className="p-3 mb-3 rounded-3" style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border-color)' }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <span className="fw-semibold">{review.userName || review.user?.name || 'Anonymous'}</span>
                              <div className="mt-1">
                                {generateStars(review.rating).map((s, i) => (
                                  <span key={i} style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                                    {s === 'full' ? '★' : s === 'half' ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <small className="text-muted">{formatDate(review.createdAt || review.date)}</small>
                          </div>
                          <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>{review.comment || review.review}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="d-flex gap-2 mt-2">
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Review ${idx + 1}`}
                                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {reviewPages > 1 && (
                        <div className="d-flex justify-content-center mt-3">
                          <Pagination
                            currentPage={reviewPage}
                            totalPages={reviewPages}
                            onPageChange={(page) => {
                              setReviewPage(page);
                              dispatch(fetchReviewsByProduct({ productId: id, page, size: 5 }));
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                      <h5>No reviews yet</h5>
                      <p className="text-muted mb-3">Be the first to review this product!</p>
                      {isAuthenticated && (
                        <Button variant="outline-brand" size="sm" onClick={() => setShowReviewForm(true)}>
                          Write a Review
                        </Button>
                      )}
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          </Tab>
        </Tabs>

        {relatedProducts.length > 0 && (
          <div className="mt-5">
            <div className="section-title">
              <div>
                <span className="section-kicker">You may also like</span>
                <h2 className="mb-0">Related Products</h2>
              </div>
            </div>
            <Row className="g-3">
              {relatedProducts.slice(0, 4).map((rp) => (
                <Col key={rp.id} lg={3} md={4} sm={6} xs={6}>
                  <ProductCard product={rp} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Container>

      <Modal show={showReviewForm} onHide={() => setShowReviewForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Write a Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ReviewForm productId={id} onClose={() => setShowReviewForm(false)} />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProductDetailPage;
