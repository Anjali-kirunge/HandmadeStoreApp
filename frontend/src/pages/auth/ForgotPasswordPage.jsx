import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { forgotPassword, selectAuthLoading } from '../../redux/slices/authSlice';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await dispatch(forgotPassword(email.trim())).unwrap();
      toast.success(result?.message || 'Password reset OTP sent to your email!');
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to send OTP. Please try again.');
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
                  <FiMail size={28} style={{ color: 'var(--accent-dark)' }} />
                </div>
                <h3 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                  Forgot Password?
                </h3>
                <p className="text-muted">
                  No worries! Enter the email address associated with your account and we'll send you an
                  OTP to reset your password.
                </p>
              </div>

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-4" controlId="forgotEmail">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    isInvalid={!!error}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 py-2 fw-semibold btn-brand"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
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

export default ForgotPasswordPage;
