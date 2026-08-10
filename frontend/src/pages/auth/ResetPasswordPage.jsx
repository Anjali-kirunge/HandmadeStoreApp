import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Spinner, ProgressBar } from 'react-bootstrap';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { resetPassword, selectAuthLoading } from '../../redux/slices/authSlice';

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

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);

  const passwordStrength = getPasswordStrength(newPassword);

  useEffect(() => {
    if (!emailFromState) {
      toast.error('Session expired. Please request a new OTP.');
      navigate('/forgot-password');
    }
  }, [emailFromState, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await dispatch(resetPassword({ email: emailFromState, otp: otp.trim(), newPassword })).unwrap();
      toast.success(result?.message || 'Password reset successful!');
      toast.info('Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to reset password. The OTP may have expired.');
      toast.error(errorMsg);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Col md={6} lg={5} xl={4}>
          <Card className="shadow-lg border-0" style={{ maxWidth: '450px', margin: '0 auto' }}>
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-soft)' }}
                >
                  <FiLock size={28} style={{ color: 'var(--accent-dark)' }} />
                </div>
                <h3 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                  Reset Password
                </h3>
                <p className="text-muted">
                  Enter the OTP sent to <strong>{emailFromState}</strong> and create a new password.
                </p>
              </div>

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="resetOtp">
                  <Form.Label>OTP Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
                    }}
                    isInvalid={!!errors.otp}
                  />
                  <Form.Control.Feedback type="invalid">{errors.otp}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Check your email for the verification code.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Create a new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                      isInvalid={!!errors.newPassword}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <FiEyeOff size={18} color="#666" /> : <FiEye size={18} color="#666" />}
                    </button>
                  </div>
                  <Form.Control.Feedback type="invalid">{errors.newPassword}</Form.Control.Feedback>
                  {newPassword && (
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

                <Form.Group className="mb-4" controlId="confirmNewPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      isInvalid={!!errors.confirmPassword}
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

                <Button
                  type="submit"
                  className="w-100 py-2 fw-semibold btn-brand"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-decoration-none fw-semibold"
                  style={{ color: 'var(--brand)' }}
                >
                  ← Back to Login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPasswordPage;
