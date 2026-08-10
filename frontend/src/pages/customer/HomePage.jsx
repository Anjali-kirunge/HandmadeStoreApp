import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowRight,
  FiMail,
  FiHeart,
  FiGift,
  FiShoppingBag,
  FiPackage,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchFeaturedProducts } from '../../redux/slices/productsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import ProductCard from '../../components/product/ProductCard';
import RecentlyViewed from '../../components/common/RecentlyViewed';
import HeroCarousel from '../../components/common/HeroCarousel';
import { ProductGridSkeleton } from '../../components/common/ProductSkeleton';

const categoryIcons = {
  'Home Decor': <FiPackage size={28} />,
  'Handmade Jewelry': <FiHeart size={28} />,
  'Bags & Accessories': <FiShoppingBag size={28} />,
  'Gifts & Crafts': <FiGift size={28} />,
};



const HomePage = () => {
  const dispatch = useDispatch();
  const { featuredProducts, loading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      toast.success('Thank you for subscribing!');
      setNewsletterEmail('');
    }
  };

  const fallbackCategories =
    categories && categories.length > 0
      ? categories
      : [
        { id: 'home-decor', name: 'Home Decor' },
        { id: 'jewelry', name: 'Handmade Jewelry' },
        { id: 'bags', name: 'Bags & Accessories' },
        { id: 'gifts', name: 'Gifts & Crafts' },
      ];

  return (
    <>
      <Helmet>
        <title>Handmade Store - Handcrafted with Love</title>
      </Helmet>

      <Container fluid="lg" className="pt-4">
        {/* Hero carousel */}
        <HeroCarousel />
      </Container>

      {/* Categories */}
      <Container fluid="lg" className="py-4">
        <div className="section-title">
          <div>
            <span className="section-kicker">Collections</span>
            <h2>Shop by Category</h2>
          </div>
          <Link to="/shop" className="text-decoration-none fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--brand-light)' }}>
            Browse all <FiArrowRight />
          </Link>
        </div>

        <Row className="g-3">
          {fallbackCategories.map((category) => (
            <Col key={category.id} lg={3} md={4} sm={6} xs={6}>
              <Link to={`/shop?categoryId=${category.id}`} className="text-decoration-none d-block h-100">
                <div className="category-card">
                  <div className="category-icon">{categoryIcons[category.name] || <FiGift size={28} />}</div>
                  <h6>{category.name}</h6>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Featured Products */}
      <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="py-5 border-top border-bottom">
        <Container fluid="lg">
          <div className="section-title">
            <div>
              <span className="section-kicker">Handpicked</span>
              <h2>Featured Products</h2>
            </div>
            <Link to="/shop" className="text-decoration-none fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--brand-light)' }}>
              View all <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <Row className="g-3">
              {(featuredProducts || []).slice(0, 8).map((product) => (
                <Col key={product.id} lg={3} md={4} sm={6} xs={6}>
                  <ProductCard product={product} />
                </Col>
              ))}
              {(!featuredProducts || featuredProducts.length === 0) && (
                <Col xs={12}>
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FiGift size={32} />
                    </div>
                    <h4>Featured products coming soon</h4>
                    <p>Our artisans are hard at work crafting something special.</p>
                    <Link to="/shop">
                      <Button variant="brand">Explore the Shop</Button>
                    </Link>
                  </div>
                </Col>
              )}
            </Row>
          )}
        </Container>
      </div>

      {/* Recently viewed */}
      <Container fluid="lg" className="py-4">
        <RecentlyViewed />
      </Container>

      {/* Newsletter */}
      <Container fluid="lg" className="pb-5">
        <div className="newsletter-box">
          <div className="position-relative text-center text-md-start">
            <Row className="align-items-center justify-content-center">
              <Col md={7} className="text-center text-md-start">
                <FiMail size={36} style={{ color: 'var(--accent)' }} className="mb-3" />
                <h3 className="text-white fw-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Stay in the Loop
                </h3>
                <p className="mb-0" style={{ color: '#bfd3d0' }}>
                  Subscribe for exclusive deals, new arrivals, and artisan stories. No spam, ever.
                </p>
              </Col>
              <Col md={5} className="mt-4 mt-md-0">
                <Form onSubmit={handleNewsletter}>
                  <div className="d-flex flex-column flex-sm-row gap-2">
                    <Form.Control
                      type="email"
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      style={{ borderRadius: 'var(--radius-pill)', padding: '0.7rem 1.25rem', border: 'none' }}
                    />
                    <Button
                      type="submit"
                      variant="accent"
                      className="px-4 fw-semibold"
                      style={{ borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}
                    >
                      Subscribe
                    </Button>
                  </div>
                </Form>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
    </>
  );
};

export default HomePage;
