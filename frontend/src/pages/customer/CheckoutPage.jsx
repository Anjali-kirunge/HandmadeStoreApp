import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Form, Table, InputGroup } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiCheck, FiCreditCard, FiTruck, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchCart, applyCoupon } from '../../redux/slices/cartSlice';
import { placeOrder } from '../../redux/slices/ordersSlice';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/razorpayService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';

const steps = [
  { label: 'Shipping', icon: FiTruck },
  { label: 'Payment', icon: FiCreditCard },
  { label: 'Review', icon: FiPackage },
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, coupon, discount, loading: cartLoading } = useSelector(
    (state) => state.cart
  );
  const { loading: orderLoading } = useSelector((state) => state.orders);
  const user = useSelector(selectCurrentUser);

  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [shippingErrors, setShippingErrors] = useState({});
  const [cartFetched, setCartFetched] = useState(false);

  useEffect(() => {
    dispatch(fetchCart())
      .finally(() => setCartFetched(true))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (cartFetched && !cartLoading && items.length === 0) {
      navigate('/cart');
    }
  }, [cartFetched, items, cartLoading, navigate]);

  const validateShipping = () => {
    const errors = {};
    if (!shippingAddress.street.trim()) errors.street = 'Street address is required';
    if (!shippingAddress.city.trim()) errors.city = 'City is required';
    if (!shippingAddress.state.trim()) errors.state = 'State is required';
    if (!shippingAddress.zipCode.trim()) errors.zipCode = 'ZIP code is required';
    if (!shippingAddress.country.trim()) errors.country = 'Country is required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateShipping()) return;
    if (currentStep === 2 && !agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handlePlaceOrder();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    dispatch(applyCoupon({ code: couponCode.trim(), orderTotal: totalPrice }))
      .unwrap()
      .then(() => {
        toast.success('Coupon applied!');
        setCouponCode('');
      })
      .catch((err) => toast.error(err || 'Invalid coupon'));
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.body.appendChild(script);
    });

  const handleRazorpayCheckout = async (orderData) => {
    try {
      const createResponse = await createRazorpayOrder(orderData);
      const razorpayOrder = createResponse.data || createResponse;

      await loadRazorpayScript();

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Handmade Store',
        description: 'Handmade Store order payment',
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
          contact: user?.phone || '',
        },
        modal: {
          ondismiss: () => toast.info('Payment cancelled'),
        },
        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await verifyRazorpayPayment({
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              orderRequest: orderData,
            });
            const order = verifyResponse.data || verifyResponse;
            toast.success('Payment successful! Order placed.');
            dispatch(fetchCart());
            const orderId = order?.id;
            if (orderId) {
              navigate(`/orders/${orderId}`);
            } else {
              navigate('/orders');
            }
          } catch (err) {
            toast.error(
              err?.response?.data?.message || 'Payment verification failed. Please contact support.'
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to start Razorpay payment. Please try again.');
    }
  };

  const handlePlaceOrder = () => {
    const orderData = {
      shippingAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.zipCode}, ${shippingAddress.country}`,
      paymentMethod,
      couponCode: coupon?.code || null,
    };

    if (paymentMethod === 'RAZORPAY') {
      handleRazorpayCheckout(orderData);
      return;
    }

    dispatch(placeOrder(orderData))
      .unwrap()
      .then((res) => {
        toast.success('Order placed successfully!');
        dispatch(fetchCart());
        const orderId = res?.data?.id || res?.id;
        if (orderId) {
          navigate(`/orders/${orderId}`);
        } else {
          navigate('/orders');
        }
      })
      .catch((err) => toast.error(err || 'Failed to place order'));
  };

  const shippingCost = totalPrice > 999 ? 0 : 99;
  const grandTotal = totalPrice - (discount || 0) + shippingCost;

  if (cartLoading || !cartFetched) return <LoadingSpinner />;

  return (
    <>
      <Helmet>
        <title>Checkout - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Checkout
        </h2>

        <div className="d-flex justify-content-center mb-5">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={index} className="d-flex align-items-center">
                <div className="d-flex flex-column align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: '45px',
                      height: '45px',
                      backgroundColor: isCompleted
                        ? 'var(--success)'
                        : isActive
                        ? 'var(--brand)'
                        : 'var(--border-color)',
                      color: isCompleted || isActive ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {isCompleted ? <FiCheck size={20} /> : <StepIcon size={20} />}
                  </div>
                  <small
                    className="fw-semibold"
                    style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }}
                  >
                    {step.label}
                  </small>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className="mx-3"
                    style={{
                      width: '80px',
                      height: '2px',
                      backgroundColor: index < currentStep ? 'var(--success)' : 'var(--border-color)',
                      marginBottom: '20px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <Row>
          <Col lg={8}>
            {currentStep === 0 && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    <FiTruck className="me-2" /> Shipping Address
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Label className="fw-semibold">Street Address *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter street address"
                        value={shippingAddress.street}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, street: e.target.value })
                        }
                        isInvalid={!!shippingErrors.street}
                      />
                      <Form.Control.Feedback type="invalid">
                        {shippingErrors.street}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">City *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter city"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        isInvalid={!!shippingErrors.city}
                      />
                      <Form.Control.Feedback type="invalid">
                        {shippingErrors.city}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">State *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter state"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        isInvalid={!!shippingErrors.state}
                      />
                      <Form.Control.Feedback type="invalid">
                        {shippingErrors.state}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">ZIP Code *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter ZIP code"
                        value={shippingAddress.zipCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                        }
                        isInvalid={!!shippingErrors.zipCode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {shippingErrors.zipCode}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Country *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter country"
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                        isInvalid={!!shippingErrors.country}
                      />
                      <Form.Control.Feedback type="invalid">
                        {shippingErrors.country}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {currentStep === 1 && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    <FiCreditCard className="me-2" /> Payment Method
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="radio"
                    id="payment-stripe"
                    label={
                      <div>
                        <span className="fw-semibold">Credit/Debit Card (Stripe)</span>
                        <br />
                        <small className="text-muted">Secure online payment</small>
                      </div>
                    }
                    name="paymentMethod"
                    value="STRIPE"
                    checked={paymentMethod === 'STRIPE'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-3 p-3 rounded"
                    style={{
                      border: paymentMethod === 'STRIPE' ? '2px solid var(--brand)' : '1px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'STRIPE' ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                    }}
                  />
                  <Form.Check
                    type="radio"
                    id="payment-razorpay"
                    label={
                      <div>
                        <span className="fw-semibold">Razorpay</span>
                        <br />
                        <small className="text-muted">UPI, Net Banking, Wallets</small>
                      </div>
                    }
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-3 p-3 rounded"
                    style={{
                      border: paymentMethod === 'RAZORPAY' ? '2px solid var(--brand)' : '1px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'RAZORPAY' ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                    }}
                  />
                  <Form.Check
                    type="radio"
                    id="payment-cod"
                    label={
                      <div>
                        <span className="fw-semibold">Cash on Delivery</span>
                        <br />
                        <small className="text-muted">Pay when your order arrives</small>
                      </div>
                    }
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-3 rounded"
                    style={{
                      border: paymentMethod === 'COD' ? '2px solid var(--brand)' : '1px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'COD' ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                    }}
                  />
                </Card.Body>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                  <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                    <FiPackage className="me-2" /> Review Your Order
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <h6 className="fw-bold mb-2">Shipping Address</h6>
                    <p className="mb-0 text-muted">
                      {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} -{' '}
                      {shippingAddress.zipCode}, {shippingAddress.country}
                    </p>
                  </div>

                  <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <h6 className="fw-bold mb-2">Payment Method</h6>
                    <p className="mb-0 text-muted">
                      {paymentMethod === 'COD' && 'Cash on Delivery'}
                      {paymentMethod === 'STRIPE' && 'Credit/Debit Card (Stripe)'}
                      {paymentMethod === 'RAZORPAY' && 'Razorpay'}
                    </p>
                  </div>

                  <h6 className="fw-bold mb-3">Order Items</h6>
                  <div className="table-responsive">
                    <Table size="sm">
                      <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <tr>
                          <th>Product</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const productName = item.productName || item.product?.name || item.name;
                          const itemPrice = item.discountPrice || item.product?.discountPrice || item.price || item.product?.price || 0;
                          const itemQuantity = item.quantity || 1;
                          return (
                            <tr key={item.productId || item.id}>
                              <td>{productName}</td>
                              <td className="text-center">{itemQuantity}</td>
                              <td className="text-end">{formatPrice(itemPrice)}</td>
                              <td className="text-end fw-semibold">
                                {formatPrice(itemPrice * itemQuantity)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>

                  <Form.Check
                    type="checkbox"
                    id="agree-terms"
                    label={
                      <span>
                        I agree to the{' '}
                        <Link to="#" className="text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="#" className="text-decoration-none" style={{ color: 'var(--text-primary)' }}>
                          Privacy Policy
                        </Link>
                      </span>
                    }
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-3"
                  />
                </Card.Body>
              </Card>
            )}

            <div className="d-flex justify-content-between">
              <Button
                variant="outline-dark"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={orderLoading}
                className="px-4 fw-semibold"
                style={{
                  backgroundColor: currentStep === 2 ? 'var(--accent)' : 'var(--brand)',
                  borderColor: currentStep === 2 ? 'var(--accent)' : 'var(--brand)',
                  color: '#fff',
                }}
              >
                {orderLoading ? (
                  <>Processing...</>
                ) : currentStep === 2 ? (
                  'Place Order'
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm" style={{ position: 'sticky', top: '20px' }}>
              <Card.Header className="bg-white border-bottom">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Order Summary
                </h5>
              </Card.Header>
              <Card.Body>
                {items.map((item) => {
                  const productName = item.productName || item.product?.name || item.name;
                  const itemPrice = item.discountPrice || item.product?.discountPrice || item.price || item.product?.price || 0;
                  const itemQuantity = item.quantity || 1;
                  return (
                    <div key={item.productId || item.id} className="d-flex justify-content-between mb-2">
                      <small className="text-muted">
                        {productName} × {itemQuantity}
                      </small>
                      <small className="fw-semibold">{formatPrice(itemPrice * itemQuantity)}</small>
                    </div>
                  );
                })}

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>

                {currentStep >= 1 && !coupon && (
                  <div className="mb-2">
                    <InputGroup size="sm">
                      <Form.Control
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline-dark" onClick={handleApplyCoupon}>
                        Apply
                      </Button>
                    </InputGroup>
                  </div>
                )}

                {discount > 0 && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Discount</span>
                    <span style={{ color: 'var(--price-color)' }}>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Shipping</span>
                  <span>{shippingCost === 0 ? <span style={{ color: 'var(--price-color)' }}>FREE</span> : formatPrice(shippingCost)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                  <span className="fs-5 fw-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span className="fs-5 fw-bold" style={{ color: 'var(--price-color)' }}>
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CheckoutPage;
