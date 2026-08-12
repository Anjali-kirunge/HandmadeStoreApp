import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Form, Table, InputGroup, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchCart, updateCartItem, removeFromCart, applyCoupon, resetCoupon } from '../../redux/slices/cartSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, totalPrice, totalItems, coupon, discount, loading } = useSelector(
    (state) => state.cart
  );
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateCartItem({ productId, quantity: newQuantity }))
      .unwrap()
      .catch((err) => toast.error(err || 'Failed to update quantity'));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId))
      .unwrap()
      .then(() => toast.success('Item removed from cart'))
      .catch((err) => toast.error(err || 'Failed to remove item'));
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    dispatch(applyCoupon({ code: couponCode.trim(), orderTotal: totalPrice }))
      .unwrap()
      .then(() => {
        toast.success('Coupon applied successfully!');
        setCouponCode('');
      })
      .catch((err) => toast.error(err || 'Invalid coupon code'));
  };

  const handleRemoveCoupon = () => {
    dispatch(resetCoupon());
    toast.info('Coupon removed');
  };

  if (loading && items.length === 0) {
    return <LoadingSpinner />;
  }

  const shippingEstimate = totalPrice > 999 ? 0 : 99;
  const grandTotal = totalPrice - (discount || 0) + shippingEstimate;

  if (!items || items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - Handmade Store</title>
        </Helmet>
        <Container className="py-5">
          <div className="text-center py-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <FiShoppingBag size={80} className="text-muted mb-3" />
            <h3 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
              Your cart is empty
            </h3>
            <p className="text-muted mb-4">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link to="/shop">
              <Button
                className="px-4 py-2 fw-semibold"
                style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
              >
                <FiArrowLeft className="me-2" /> Continue Shopping
              </Button>
            </Link>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shopping Cart - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h2>

        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <div className="table-responsive">
                <Table className="table-custom mb-0 align-middle">
                  <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <tr>
                      <th className="fw-semibold" style={{ color: 'var(--text-primary)' }}>Product</th>
                      <th className="fw-semibold text-center" style={{ color: 'var(--text-primary)' }}>Price</th>
                      <th className="fw-semibold text-center" style={{ color: 'var(--text-primary)' }}>Quantity</th>
                      <th className="fw-semibold text-center" style={{ color: 'var(--text-primary)' }}>Subtotal</th>
                      <th className="fw-semibold text-center" style={{ color: 'var(--text-primary)' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const productId = item.productId || item.product?.id || item.id;
                      const productName = item.productName || item.product?.name || item.name;
                      const productImage = item.product?.imageUrl || item.imageUrl;
                      const itemPrice = item.discountPrice || item.product?.discountPrice || item.price || item.product?.price || 0;
                      const itemQuantity = item.quantity || 1;

                      return (
                        <tr key={productId}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link to={`/product/${productId}`}>
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={productName}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                                    className="me-3"
                                  />
                                ) : (
                                  <div
                                    className="me-3 d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      backgroundColor: 'var(--bg-tertiary)',
                                      borderRadius: '6px',
                                      fontSize: '1.5rem',
                                    }}
                                  >
                                    📦
                                  </div>
                                )}
                              </Link>
                              <Link
                                to={`/product/${productId}`}
                                className="text-decoration-none fw-semibold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {productName}
                              </Link>
                            </div>
                          </td>
                          <td className="text-center">
                            <span style={{ color: 'var(--price-color)' }}>
                              {formatPrice(itemPrice)}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleQuantityChange(productId, itemQuantity - 1)}
                                disabled={itemQuantity <= 1}
                                style={{ width: '32px', height: '32px' }}
                              >
                                −
                              </Button>
                              <Form.Control
                                type="number"
                                min="1"
                                value={itemQuantity}
                                onChange={(e) => handleQuantityChange(productId, parseInt(e.target.value) || 1)}
                                className="mx-2 text-center"
                                style={{ width: '60px' }}
                              />
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleQuantityChange(productId, itemQuantity + 1)}
                                style={{ width: '32px', height: '32px' }}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td className="text-center fw-bold" style={{ color: 'var(--price-color)' }}>
                            {formatPrice(itemPrice * itemQuantity)}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemove(productId)}
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>
            <Link to="/shop" className="text-decoration-none">
              <Button variant="outline-dark">
                <FiArrowLeft className="me-2" /> Continue Shopping
              </Button>
            </Link>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Order Summary
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal ({totalItems} items)</span>
                  <span className="fw-semibold">{formatPrice(totalPrice)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Shipping</span>
                  <span className={shippingEstimate === 0 ? 'fw-semibold' : 'fw-semibold'}>
                    {shippingEstimate === 0 ? (
                      <span style={{ color: 'var(--price-color)' }}>FREE</span>
                    ) : (
                      formatPrice(shippingEstimate)
                    )}
                  </span>
                </div>
                {shippingEstimate > 0 && (
                  <small className="text-muted d-block mb-2">
                    Free shipping on orders above ₹999
                  </small>
                )}

                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Coupon Discount</span>
                    <span style={{ color: 'var(--price-color)' }}>-{formatPrice(discount)}</span>
                  </div>
                )}

                <hr />

                <div className="mb-3">
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                    Coupon Code
                  </Form.Label>
                  {coupon ? (
                    <div className="d-flex align-items-center justify-content-between p-2 rounded"
                      style={{ backgroundColor: 'var(--success-soft)' }}>
                      <div>
                        <Badge bg="success" className="me-2">Applied</Badge>
                        <span className="fw-semibold">{coupon.code || couponCode}</span>
                      </div>
                      <Button variant="link" size="sm" className="text-danger p-0" onClick={handleRemoveCoupon}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button
                        variant="outline-dark"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    </InputGroup>
                  )}
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <span className="fs-5 fw-bold" style={{ color: 'var(--text-primary)' }}>
                    Grand Total
                  </span>
                  <span className="fs-5 fw-bold" style={{ color: 'var(--price-color)' }}>
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <Link to="/checkout" className="d-grid">
                  <Button
                    size="lg"
                    className="fw-semibold py-2"
                    style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CartPage;
