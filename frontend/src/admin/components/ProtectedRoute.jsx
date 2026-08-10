import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';

export default function ProtectedRoute({ children }) {
  const user = useSelector(selectCurrentUser);
  
  if (!user || user.role !== 'ROLE_ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
}
