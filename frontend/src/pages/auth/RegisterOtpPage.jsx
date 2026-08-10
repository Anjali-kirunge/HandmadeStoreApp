import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  verifyRegistrationOtp,
  resendRegistrationOtp,
  selectAuthLoading,
  selectIsAuthenticated,
} from '../../redux/slices/authSlice';

const RESEND_COOLDOWN = 60;

const RegisterOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [email, setEmail] = useState(() => {
    return location.state?.email || sessionStorage.getItem('pendingRegEmail') || '';
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    countdownRef.current = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(countdownRef.current);
  }, [resendCountdown]);

  useEffect(() => () => clearTimeout(countdownRef.current), []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    setError('');
    setResendError('');
    try {
      const result = await dispatch(
        verifyRegistrationOtp({ email: email.trim(), otp })
      ).unwrap();
      sessionStorage.removeItem('pendingRegEmail');
      toast.success(result?.message || 'Email verified successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || !email.trim()) return;
    setError('');
    setResendError('');
    try {
      const result = await dispatch(resendRegistrationOtp(email.trim())).unwrap();
      toast.success(result?.message || 'A new OTP has been sent to your email.');
      setResendCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setResendError(err?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleUseDifferentEmail = () => {
    sessionStorage.removeItem('pendingRegEmail');
    navigate('/register');
  };

  return (
    <Container>
      <Row className="justify-content-center align-items-center py-5">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-soft)' }}
                >
                  <FiShield size={28} style={{ color: 'var(--accent-dark)' }} />
                </div>
                <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                  Verify Your Email
                </h2>
                <p className="text-muted">
                  We sent a 6-digit code to your email. Enter it below to activate your account.
                </p>
              </div>

              {error && (
                <Alert variant="danger" className="py-2 small">{error}</Alert>
              )}
              {resendError && (
                <Alert variant="danger" className="py-2 small">{resendError}</Alert>
              )}

              <Form onSubmit={handleVerify} noValidate>
                <Form.Group className="mb-3" controlId="otpEmail">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="otpInput">
                  <Form.Label>Enter 6-digit OTP</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    autoFocus
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 py-2 fw-semibold btn-brand"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Activate Account'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <span className="text-muted small">Didn't receive the code? </span>
                <Button
                  variant="link"
                  className="p-0 fw-semibold small"
                  style={{ color: 'var(--brand)' }}
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || isLoading}
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                </Button>
              </div>

              <div className="text-center mt-2">
                <Button
                  variant="link"
                  className="p-0 small text-muted"
                  onClick={handleUseDifferentEmail}
                >
                  ← Use a different email
                </Button>
              </div>

              <hr className="my-4" />

              <div className="text-center">
                <span className="text-muted">Already verified? </span>
                <Link
                  to="/login"
                  className="fw-semibold text-decoration-none"
                  style={{ color: 'var(--brand)' }}
                >
                  Login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterOtpPage;
