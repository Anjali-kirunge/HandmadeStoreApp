import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthLoading, selectAuthError } from '../../redux/slices/authSlice';
import { getErrorMessage } from '../utils/helpers';
import '../admin.css';
import Logo from '../../components/common/Logo';

export default function Login() {
  const [email, setEmail] = useState('admin@handmade.com');
  const [password, setPassword] = useState('admin123');
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password })).unwrap();
      if (resultAction.user?.role !== 'ROLE_ADMIN') {
         setError('You do not have administrator access.');
         return;
      }
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="admin-layout">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <Logo size={48} showWordmark={false} />
          </div>
          <h1 className="auth-title">Admin Access</h1>
          <p className="auth-subtitle">Sign in to manage Handmade Store</p>

          {(error || authError) && (
            <div className="auth-error">
              {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              style={{ padding: '12px', fontSize: '14.5px' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="muted text-center mt-4" style={{ fontSize: 12 }}>
            Only administrator accounts can access this panel.
          </p>
        </div>
      </div>
    </div>
  );
}
