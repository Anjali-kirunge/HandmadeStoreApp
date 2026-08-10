import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { addToCart } from '../../redux/slices/cartSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice, truncateText, generateStars } from '../../utils/helpers';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleAddToCart = (productId) => {
    dispatch(addToCart({ productId, quantity: 1 }))
      .unwrap()
      .then(() => toast.success('Added to cart!'))
      .catch((err) => toast.error(err || 'Failed to add to cart'));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId))
      .unwrap()
      .then(() => toast.success('Removed from wishlist'))
      .catch((err) => toast.error(err || 'Failed to remove from wishlist'));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Helmet>
        <title>My Wishlist - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          <FiHeart className="me-2" /> My Wishlist ({products.length} {products.length === 1 ? 'item' : 'items'})
        </h2>

        {products && products.length > 0 ? (
          <Row className="g-3">
            {products.map((product) => {
              const stars = generateStars(product.rating || product.averageRating || 0);
              const discountedPrice = product.discountPrice || product.discountedPrice;
              const hasDiscount = discountedPrice && discountedPrice < product.price;

              return (
                <Col key={product.id} lg={3} md={4} sm={6} xs={6}>
                  <Card className="h-100 shadow-sm border-0">
                    <Link to={`/product/${product.id}`} className="text-decoration-none">
                      <div className="position-relative overflow-hidden" style={{ height: '200px', backgroundColor: 'var(--bg-tertiary)' }}>
                        {product.imageUrl ? (
                          <Card.Img
                            variant="top"
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100">
                            <span style={{ fontSize: '3rem' }}>📦</span>
                          </div>
                        )}
                        {hasDiscount && (
                          <Badge
                            className="position-absolute top-0 start-0 m-2"
                            style={{ backgroundColor: 'var(--danger)' }}
                          >
                            {Math.round(((product.price - discountedPrice) / product.price) * 100)}% off
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <Card.Body className="d-flex flex-column p-3">
                      <Link to={`/product/${product.id}`} className="text-decoration-none">
                        <Card.Title className="fw-semibold" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {truncateText(product.name, 45)}
                        </Card.Title>
                      </Link>
                      <div className="mb-2">
                        {stars.map((s, i) => (
                          <span key={i} style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                            {s === 'full' ? '★' : s === 'half' ? '★' : '☆'}
                          </span>
                        ))}
                        <small className="text-muted ms-1">({product.reviewCount || 0})</small>
                      </div>
                      <div className="mb-2">
                        {hasDiscount ? (
                          <div>
                            <span className="fw-bold" style={{ color: 'var(--price-color)', fontSize: '1.05rem' }}>
                              {formatPrice(discountedPrice)}
                            </span>
                            <small className="text-decoration-line-through text-muted ms-2">
                              {formatPrice(product.price)}
                            </small>
                          </div>
                        ) : (
                          <span className="fw-bold" style={{ color: 'var(--price-color)', fontSize: '1.05rem' }}>
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto d-flex gap-2">
                        <Button
                          variant="warning"
                          size="sm"
                          className="flex-grow-1 fw-semibold"
                          style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
                          onClick={() => handleAddToCart(product.id)}
                        >
                          <FiShoppingCart className="me-1" /> Add to Cart
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemove(product.id)}
                        >
                          <FiTrash2 />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <div className="text-center py-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <FiHeart size={80} className="text-muted mb-3" />
            <h4 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
              Your wishlist is empty
            </h4>
            <p className="text-muted mb-4">
              Save items you love to your wishlist and come back anytime.
            </p>
            <Link to="/shop">
              <Button
                className="px-4 py-2 fw-semibold"
                style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
              >
                Discover Something New
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </>
  );
};

export default WishlistPage;
