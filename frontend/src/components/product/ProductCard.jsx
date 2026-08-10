import { Badge, Button, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShoppingCart, FiStar, FiArrowRight } from 'react-icons/fi';
import { addToCart, selectCartItems } from '../../redux/slices/cartSlice';
import { addToWishlist } from '../../redux/slices/wishlistSlice';
import { formatPrice, truncateText, getDiscountedPrice } from '../../utils/helpers';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems);
  const { id, name, price, discountPrice, imageUrl, rating, reviewCount, stockQuantity } = product;


  const effectivePrice = discountPrice && discountPrice < price ? discountPrice : price;
  const savings = discountPrice && discountPrice < price ? getDiscountedPrice(price, discountPrice) : 0;
  const hasDiscount = savings > 0;
  const outOfStock = stockQuantity <= 0;
  const stars = rating || 0;

  const isInCart = cartItems.some((item) => (item.productId || item.product?.id || item.id) === id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart) {
      navigate('/cart');
      return;
    }
    if (outOfStock) {
      toast.warning('Product is out of stock');
      return;
    }
    dispatch(addToCart({ productId: id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToWishlist({ productId: id }));
    toast.success('Added to wishlist!');
  };

  return (
    <div className="product-card">
      <Link to={`/product/${id}`} className="text-decoration-none">
        <div className="product-media">
          <img
            src={imageUrl || 'https://placehold.co/400x400/EEE/999?text=No+Image'}
            alt={name}
            loading="lazy"
          />
          {hasDiscount && <span className="product-badge">-{savings}%</span>}
          {outOfStock && <span className="product-stock-badge">Out of Stock</span>}
        </div>
      </Link>

      <button
        className="product-wishlist"
        onClick={handleAddToWishlist}
        title="Add to Wishlist"
        aria-label="Add to Wishlist"
      >
        <FiHeart size={17} />
      </button>

      <div className="product-body">
        {product.category?.name && (
          <span className="product-category">{truncateText(product.category.name, 24)}</span>
        )}
        <Link to={`/product/${id}`} className="text-decoration-none">
          <h6 className="product-title">{truncateText(name, 50)}</h6>
        </Link>

        <div className="d-flex align-items-center justify-content-between mt-1">
          {stars > 0 ? (
            <span className="product-rating">
              <FiStar size={12} fill="currentColor" /> {Number(stars).toFixed(1)}
              <span style={{ fontWeight: 500, opacity: 0.75 }}>({reviewCount || 0})</span>
            </span>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              New arrival
            </span>
          )}
        </div>

        <div className="product-price-row">
          <span className="product-price">{formatPrice(effectivePrice)}</span>
          {hasDiscount && <span className="product-original-price">{formatPrice(price)}</span>}
        </div>

        <div className="product-actions mt-2">
          <Button
            variant={isInCart ? "outline-primary" : "accent"}
            onClick={handleAddToCart}
            disabled={outOfStock && !isInCart}
            className="w-100"
          >
            {isInCart ? (
              <><FiArrowRight size={15} className="me-1" /> Go to Cart</>
            ) : (
              <><FiShoppingCart size={15} className="me-1" /> {outOfStock ? 'Sold Out' : 'Add to Cart'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
