import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FiEye, FiEyeOff, FiTruck, FiShield, FiRefreshCw, FiHeart, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { loginUser, selectIsAuthenticated, selectAuthLoading } from '../../redux/slices/authSlice';
import Logo from '../../components/common/Logo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [verifyHint, setVerifyHint] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await dispatch(loginUser({ email: email.trim(), password, rememberMe })).unwrap();
      toast.success(result?.message || 'Login successful!');
      sessionStorage.setItem('showWelcomeAnimation', 'true');
      navigate(from, { replace: true });
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || 'Login failed. Please check your credentials.');
      if (/not verified|verify your email|verify your account/i.test(message)) {
        sessionStorage.setItem('pendingRegEmail', email.trim());
        setVerifyHint(true);
      }
      toast.error(message);
    }
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-brand-panel">
        <div className="position-relative">
          <div className="d-flex align-items-center gap-2">
            <Logo size={40} wordmarkStyle={{ fontSize: '1.4rem' }} />
          </div>

          <div className="mt-5">
            <h1 className="mb-3">
              Beautiful things,
              <br />
              made by hand.
            </h1>
            <p className="auth-quote mb-5">
              Welcome back! Sign in to continue your journey with one-of-a-kind
              treasures crafted by skilled artisans across India.
            </p>
          </div>

          <div className="auth-points">
            <div className="auth-point">
              <span className="auth-point-icon"><FiTruck size={18} /></span>
              Free shipping on orders above ₹499
            </div>
            <div className="auth-point">
              <span className="auth-point-icon"><FiRefreshCw size={18} /></span>
              7-day hassle-free returns
            </div>
            <div className="auth-point">
              <span className="auth-point-icon"><FiShield size={18} /></span>
              Secure & encrypted payments
            </div>
          </div>
        </div>

        <p className="position-relative small d-flex align-items-center gap-1 mt-5" style={{ color: '#bcd1ce' }}>
          <FiHeart size={14} style={{ color: 'var(--accent)' }} /> Loved by 10,000+ happy customers
        </p>
      </aside>

      <div className="auth-form-panel">
        <div className="auth-card animate-in">
          <div className="text-center mb-4">
            <h2 className="mb-1">Welcome back</h2>
            <p className="text-muted mb-0">Sign in to your account</p>
          </div>

          {verifyHint && (
            <Alert variant="warning" className="py-2 small d-flex justify-content-between align-items-center">
              <span>Your account is not verified yet.</span>
              <Link to="/verify-otp" className="fw-semibold text-decoration-none" style={{ color: 'var(--brand-light)' }}>
                Verify now
              </Link>
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                isInvalid={!!errors.email}
                autoComplete="email"
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  isInvalid={!!errors.password}
                  autoComplete="current-password"
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <FiEyeOff size={18} color="var(--text-muted)" />
                  ) : (
                    <FiEye size={18} color="var(--text-muted)" />
                  )}
                </button>
              </div>
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Form.Check
                type="checkbox"
                id="remember-me"
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link to="/forgot-password" className="text-decoration-none fw-semibold small" style={{ color: 'var(--brand-light)' }}>
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="brand"
              className="w-100 py-2 fw-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <FiArrowRight className="ms-1" />
                </>
              )}
            </Button>
          </Form>

          <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

          <div className="text-center">
            <span className="text-muted">Don't have an account? </span>
            <Link to="/register" className="fw-bold text-decoration-none" style={{ color: 'var(--brand-light)' }}>
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
