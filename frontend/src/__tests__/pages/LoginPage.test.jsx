import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from '../../pages/auth/LoginPage';
import authReducer from '../../redux/slices/authSlice';

const createTestStore = () => configureStore({
  reducer: { auth: authReducer },
});

const renderLogin = () => render(
  <Provider store={createTestStore()}>
    <BrowserRouter><LoginPage /></BrowserRouter>
  </Provider>
);

describe('LoginPage', () => {
  test('renders email input', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/ii) || screen.getByPlaceholderText(/email/i)).toBeTruthy();
  });
  test('renders login button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
