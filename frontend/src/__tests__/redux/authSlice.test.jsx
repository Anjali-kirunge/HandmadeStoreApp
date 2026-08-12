import authReducer, { clearError, setUser, logoutUser } from '../../redux/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    pendingVerificationEmail: null,
  };

  test('returns initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('clearError clears error', () => {
    const state = authReducer({ ...initialState, error: 'test' }, clearError());
    expect(state.error).toBeNull();
  });

  test('setUser sets user and isAuthenticated', () => {
    const user = { id: 1, email: 'test@test.com' };
    const state = authReducer(initialState, setUser(user));
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  test('logoutUser.fulfilled clears state', () => {
    const loggedIn = { ...initialState, user: { id: 1 }, token: 'abc', isAuthenticated: true };
    const state = authReducer(loggedIn, { type: logoutUser.fulfilled.type });
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });
});
