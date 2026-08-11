import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar as BSNavbar, Nav, Container, Form, Dropdown } from 'react-bootstrap';
import {
  FiShoppingCart,
  FiHeart,
  FiBell,
  FiSun,
  FiMoon,
  FiSearch,
  FiLogIn,
  FiUserPlus,
  FiGrid,
  FiShield,
  FiPackage,
  FiLogOut,
  FiShoppingBag,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';
import { logoutUser, selectCurrentUser, selectIsAuthenticated } from '../../redux/slices/authSlice';
import { selectCartItemCount } from '../../redux/slices/cartSlice';
import { getUnreadCount } from '../../redux/slices/notificationsSlice';
import { ROLES } from '../../utils/constants';
import useTheme from '../../hooks/useTheme';
import Logo from '../common/Logo';

const Navbar = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expanded, setExpanded] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartItemCount = useSelector(selectCartItemCount);
  const wishlistCount = useSelector((state) => state.wishlist?.products?.length || 0);
  const unreadNotifications = useSelector((state) => state.notifications?.unreadCount || 0);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUnreadCount());
    }
  }, [isAuthenticated, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/shop?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setExpanded(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
    setExpanded(false);
  };

  const closeMobileMenu = () => setExpanded(false);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <BSNavbar
      expand="lg"
      sticky="top"
      expanded={expanded}
      onToggle={(val) => setExpanded(val)}
      variant="dark"
      className="navbar-custom shadow"
    >
      <Container fluid="lg">
        <BSNavbar.Brand
          as={Link}
          to="/"
          onClick={closeMobileMenu}
        >
          <Logo size={34} textAccent="var(--navbar-accent)" wordmarkStyle={{ color: '#ffffff' }} />
        </BSNavbar.Brand>

        <BSNavbar.Toggle aria-controls="main-navbar" />

        <BSNavbar.Collapse id="main-navbar">
          <Nav className="me-auto d-flex align-items-lg-center gap-lg-1 mt-3 mt-lg-0">
            <Nav.Link as={Link} to="/shop" onClick={closeMobileMenu}>
              <FiShoppingBag className="me-1" /> Shop
            </Nav.Link>
            <Nav.Link as={Link} to="/cart" onClick={closeMobileMenu} className="d-lg-none">
              <FiShoppingCart className="me-1" /> Cart{' '}
              {cartItemCount > 0 && <span className="text-muted">({cartItemCount})</span>}
            </Nav.Link>
            <Nav.Link as={Link} to="/wishlist" onClick={closeMobileMenu} className="d-lg-none">
              <FiHeart className="me-1" /> Wishlist{' '}
              {wishlistCount > 0 && <span className="text-muted">({wishlistCount})</span>}
            </Nav.Link>
          </Nav>

          <Form
            className="d-none d-lg-flex mx-lg-4 my-3 my-lg-0"
            onSubmit={handleSearch}
            style={{ maxWidth: '460px', width: '100%' }}
          >
            <div className="nav-search w-100">
              <input
                type="search"
                placeholder="Search handcrafted products..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                aria-label="Search"
              />
              <button type="submit" aria-label="Search">
                <FiSearch size={18} />
              </button>
            </div>
          </Form>

          <div className="d-flex align-items-center gap-1">
            <button
              className="nav-icon-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FiSun size={19} /> : <FiMoon size={19} />}
            </button>

            {isAuthenticated && (
              <button
                className="nav-icon-btn"
                title="Notifications"
                onClick={() => {
                  navigate('/notifications');
                  closeMobileMenu();
                }}
              >
                <FiBell size={19} />
                {unreadNotifications > 0 && (
                  <span className="nav-count">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                )}
              </button>
            )}

            <button
              className="nav-icon-btn"
              title="Cart"
              onClick={() => {
                navigate('/cart');
                closeMobileMenu();
              }}
            >
              <FiShoppingCart size={19} />
              {cartItemCount > 0 && <span className="nav-count">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
            </button>

            <button
              className="nav-icon-btn"
              title="Wishlist"
              onClick={() => {
                navigate('/wishlist');
                closeMobileMenu();
              }}
            >
              <FiHeart size={19} />
              {wishlistCount > 0 && <span className="nav-count">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
            </button>

            {isAuthenticated ? (
              <Dropdown align="end" className="ms-1">
                <Dropdown.Toggle variant="link" className="user-chip" style={{ textDecoration: 'none' }}>
                  <span className="user-avatar">{userInitial}</span>
                  <span className="d-none d-md-inline">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <FiChevronDown size={13} />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <div className="px-3 py-2 border-bottom">
                    <div className="fw-semibold">{user?.name || 'User'}</div>
                    <small className="text-muted">{user?.email || ''}</small>
                  </div>
                  <div className="p-1">
                    <Dropdown.Item as={Link} to="/profile" onClick={closeMobileMenu}>
                      <FiUser className="me-2" /> My Profile
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/orders" onClick={closeMobileMenu}>
                      <FiPackage className="me-2" /> My Orders
                    </Dropdown.Item>
                    {user?.role === ROLES?.SELLER && (
                      <Dropdown.Item as={Link} to="/seller/dashboard" onClick={closeMobileMenu}>
                        <FiGrid className="me-2" /> Seller Dashboard
                      </Dropdown.Item>
                    )}
                    {user?.role === ROLES?.ADMIN && (
                      <Dropdown.Item as={Link} to="/admin/dashboard" onClick={closeMobileMenu}>
                        <FiShield className="me-2" /> Admin Panel
                      </Dropdown.Item>
                    )}
                  </div>
                  <Dropdown.Divider />
                  <div className="p-1">
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <FiLogOut className="me-2" /> Logout
                    </Dropdown.Item>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex align-items-center gap-2 ms-1">
                <Link
                  to="/login"
                  className="nav-auth-cta text-white d-flex align-items-center"
                  onClick={closeMobileMenu}
                  style={{ color: 'var(--navbar-text)' }}
                >
                  <FiLogIn size={15} className="me-1" /> Login
                </Link>
                <Link
                  to="/register"
                  className="nav-auth-cta d-flex align-items-center"
                  onClick={closeMobileMenu}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), #f59e0b)',
                    color: '#1c1917',
                    boxShadow: '0 4px 14px -4px rgba(217, 119, 6, 0.5)',
                  }}
                >
                  <FiUserPlus size={15} className="me-1" /> Register
                </Link>
              </div>
            )}
          </div>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
