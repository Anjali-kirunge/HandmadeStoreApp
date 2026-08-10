import { useState, useRef, useEffect, useCallback } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import otpService from '../../services/otpService';

const OtpVerification = ({ email, type = 'VERIFICATION', onVerified, onCancelled }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);
      const nextEmptyIndex = newOtp.findIndex((val) => !val);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await otpService.verifyOtp(email, otpString, type);
      toast.success('OTP verified successfully!');
      onVerified?.(otpString);
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [otp, email, type, onVerified]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await otpService.generateOtp(email, type);
      toast.success('OTP sent to your email!');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-verification text-center">
      <h5 className="mb-3">Verification Code</h5>
      <p className="text-muted mb-4">
        We've sent a 6-digit code to <strong>{email}</strong>
      </p>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      <div className="d-flex justify-content-center gap-2 mb-4">
        {otp.map((digit, index) => (
          <Form.Control
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="text-center fw-bold"
            style={{
              width: '48px',
              height: '56px',
              fontSize: '1.5rem',
              borderRadius: '8px',
            }}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      <Button
        variant="primary"
        className="w-100 mb-3 py-2 fw-semibold"
        onClick={handleVerify}
        disabled={loading || otp.join('').length !== 6}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Verifying...
          </>
        ) : (
          'Verify OTP'
        )}
      </Button>

      <div className="d-flex justify-content-center gap-3">
        <Button
          variant="link"
          className="text-decoration-none p-0"
          onClick={handleResend}
          disabled={!canResend || resendLoading}
        >
          {resendLoading ? (
            <Spinner animation="border" size="sm" />
          ) : canResend ? (
            'Resend OTP'
          ) : (
            `Resend OTP in ${countdown}s`
          )}
        </Button>
        {onCancelled && (
          <Button
            variant="link"
            className="text-decoration-none p-0 text-danger"
            onClick={onCancelled}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default OtpVerification;
