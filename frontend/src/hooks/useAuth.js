import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, token, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );
  return { user, token, isAuthenticated, loading };
};

export default useAuth;
