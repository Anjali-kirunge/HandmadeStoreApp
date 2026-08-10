import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import Logo from '../common/Logo';
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHeart,
  FiShield,
  FiRefreshCw,
  FiCreditCard,
} from 'react-icons/fi';

const Footer = () => {
  const year = new Date().getFullYear();
  const dispatch = useDispatch();
  const { categories, status } = useSelector((state) => state.categories);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [status, dispatch]);

  const displayCategories = categories && categories.length > 0 
    ? categories.slice(0, 6) 
    : [];

  const socialLinks = [
    { icon: <FiFacebook size={18} />, label: 'Facebook', href: 'https://facebook.com' },
    { icon: <FiTwitter size={18} />, label: 'Twitter', href: 'https://twitter.com' },
    { icon: <FiInstagram size={18} />, label: 'Instagram', href: 'https://instagram.com' },
    { icon: <FiYoutube size={18} />, label: 'YouTube', href: 'https://youtube.com' },
  ];

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Cart', path: '/cart' },
    { label: 'My Orders', path: '/orders' },
    { label: 'About Us', path: '/about' },
  ];

  const trustBadges = [
    { icon: <FiRefreshCw size={15} />, label: 'Easy Returns' },
    { icon: <FiCreditCard size={15} />, label: 'Secure Payments' },
    { icon: <FiShield size={15} />, label: '100% Genuine' },
    { icon: <FiHeart size={15} />, label: 'Handmade Love' },
  ];

  return (
    <footer className="footer">
      <Container className="py-5">
        <Row className="g-4">
          <Col lg={4} md={6} sm={12}>
            <div className="mb-3">
              <Logo size={40} textAccent="var(--navbar-accent)" wordmarkStyle={{ color: '#fff', fontSize: '1.3rem' }} />
            </div>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.8 }}>
              Your destination for unique, handcrafted products made with love and care.
              From artisan jewelry to hand-painted décor, every piece tells a story.
              Support local craftsmen and bring home something truly special.
            </p>
            <div className="d-flex gap-2 mt-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="nav-icon-btn"
                  style={{ width: 38, height: 38, color: 'var(--footer-text)' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </Col>

          <Col lg={2} md={6} sm={6}>
            <h5 className="footer-title">Quick Links</h5>
            <ul className="list-unstyled">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col lg={2} md={6} sm={6}>
            <h5 className="footer-title">Categories</h5>
            <ul className="list-unstyled">
              {displayCategories.map((category) => (
                <li key={category.id}>
                  <Link to={`/shop?categoryId=${category.id}`} className="footer-link">
                    {category.name}
                  </Link>
                </li>
              ))}
              {displayCategories.length === 0 && (
                <li>
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>Loading...</span>
                </li>
              )}
            </ul>
          </Col>

          <Col lg={4} md={6} sm={12}>
            <h5 className="footer-title">Get in Touch</h5>
            <ul className="list-unstyled">
              <li className="d-flex align-items-start mb-3">
                <FiMapPin size={18} className="me-2 mt-1" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem' }}>
                  Handmade Store HQ,<br />Artisan District, Mumbai, India
                </span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <FiMail size={18} className="me-2" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <a href="mailto:support@handmade.com" className="footer-link mb-0">
                  support@handmade.com
                </a>
              </li>
              <li className="d-flex align-items-center mb-3">
                <FiPhone size={18} className="me-2" style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <a href="tel:+919876543210" className="footer-link mb-0">
                  +91 9876543210
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0 1.5rem' }} />

        <Row className="align-items-center">
          <Col md={6}>
            <p className="mb-0" style={{ color: 'var(--footer-text)', fontSize: '0.85rem' }}>
              &copy; {year} Handmade Store. All rights reserved. Made with{' '}
              <FiHeart size={12} style={{ color: 'var(--accent)' }} /> for artisans.
            </p>
          </Col>
          <Col md={6}>
            <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0 justify-content-md-end">
              {trustBadges.map((b) => (
                <span
                  key={b.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    color: 'var(--footer-text)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 12px',
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}>{b.icon}</span> {b.label}
                </span>
              ))}
            </div>
          </Col>
        </Row>
      </Container>

      <div className="footer-bottom text-center">
        <Container>
          <Row>
            <Col>
              <span className="me-2">
                <Link to="/terms" style={{ color: 'var(--footer-text)' }}>
                  Terms of Service
                </Link>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span className="ms-2">
                <Link to="/privacy" style={{ color: 'var(--footer-text)' }}>
                  Privacy Policy
                </Link>
              </span>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
