import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Spinner, ProgressBar } from 'react-bootstrap';
import { FiEye, FiEyeOff, FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { registerUser, selectAuthLoading } from '../../redux/slices/authSlice';

const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '', variant: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 33, label: 'Weak', variant: 'danger' };
  if (score <= 4) return { level: 66, label: 'Medium', variant: 'warning' };
  return { level: 100, label: 'Strong', variant: 'success' };
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.phone && !/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { agreeTerms, ...submitData } = formData;
    try {
      const result = await dispatch(
        registerUser({
          ...submitData,
          name: `${formData.firstName} ${formData.lastName}`,
        })
      ).unwrap();
      if (result?.otpRequired) {
        sessionStorage.setItem('pendingRegEmail', formData.email.trim());
        toast.info('OTP sent to your email. Please verify to activate your account.');
        navigate('/verify-otp', { state: { email: formData.email.trim() } });
      } else {
        toast.success(result?.message || 'Registration successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Registration failed. Please try again.');
      toast.error(errorMsg);
    }
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
                  <FiMail size={28} style={{ color: 'var(--accent-dark)' }} />
                </div>
                <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                  Create Account
                </h2>
                <p className="text-muted">Join Handmade Store today</p>
              </div>

              <Form onSubmit={handleSubmit} noValidate>
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="regFirstName">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        isInvalid={!!errors.firstName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="regLastName">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        isInvalid={!!errors.lastName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3" controlId="regEmail">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="regPassword">
                  <Form.Label>Password *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!errors.password}
                      autoComplete="new-password"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
                      tabIndex={-1}
                    >
                      {showPassword ? <FiEyeOff size={18} color="#666" /> : <FiEye size={18} color="#666" />}
                    </button>
                  </div>
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  {formData.password && (
                    <div className="mt-2">
                      <ProgressBar
                        now={passwordStrength.level}
                        variant={passwordStrength.variant}
                        style={{ height: '6px' }}
                      />
                      <small className={`text-${passwordStrength.variant}`}>
                        {passwordStrength.label}
                      </small>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="regConfirmPassword">
                  <Form.Label>Confirm Password *</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!errors.confirmPassword}
                      autoComplete="new-password"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} color="#666" /> : <FiEye size={18} color="#666" />}
                    </button>
                  </div>
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="agreeTerms"
                    id="agreeTerms"
                    label={
                      <span>
                        I agree to the{' '}
                        <Link to="/terms" style={{ color: 'var(--brand)' }}>Terms & Conditions</Link>
                        {' '}and{' '}
                        <Link to="/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</Link>
                      </span>
                    }
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    isInvalid={!!errors.agreeTerms}
                    feedback={errors.agreeTerms}
                    feedbackType="invalid"
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
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <span className="text-muted">Already have an account? </span>
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

export default RegisterPage;
