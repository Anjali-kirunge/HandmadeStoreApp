import { Link } from 'react-router-dom';
import { Carousel, Row, Col, Button } from 'react-bootstrap';
import {
  FiArrowRight,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiHeart,
} from 'react-icons/fi';

const heroSlides = [
  {
    eyebrow: 'Handcrafted by artisans',
    title: (
      <>
        Beautiful things,
        <br />
        made by hand.
      </>
    ),
    sub: 'Discover one-of-a-kind handmade treasures — from artisan jewelry to hand-painted décor. Every piece tells a story worth owning.',
    primary: { label: 'Shop Now', to: '/shop' },
    secondary: { label: 'Bestsellers', to: '/shop?sortBy=rating' },
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Beautiful Handcrafted Pottery',
  },
  {
    eyebrow: 'Artisan jewelry',
    title: (
      <>
        Jewelry with a
        <br />
        handmade soul.
      </>
    ),
    sub: 'Explore delicate necklaces, earrings, and bangles crafted by skilled artisans. Each piece is finished by hand and made to be treasured.',
    primary: { label: 'Shop Jewelry', to: '/shop?categoryId=2' },
    secondary: { label: 'Bestsellers', to: '/shop?sortBy=rating' },
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Handmade Artisan Jewelry',
  },
  {
    eyebrow: 'Gifts & crafts',
    title: (
      <>
        Gifts that carry
        <br />
        a story.
      </>
    ),
    sub: 'Wrap someone&apos;s day in handcrafted gifts and décor. Thoughtful, unique, and made with love — perfect for every occasion.',
    primary: { label: 'Shop Gifts', to: '/shop?categoryId=4' },
    secondary: { label: 'Explore', to: '/shop' },
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Handcrafted Gift Box',
  },
];

const trustItems = [
  { icon: <FiTruck size={18} />, label: 'Free shipping over ₹999' },
  { icon: <FiRefreshCw size={18} />, label: 'Easy 7-day returns' },
  { icon: <FiShield size={18} />, label: 'Secure payments' },
];

const HeroCarousel = () => {
  return (
    <Carousel
      interval={6000}
      pause="hover"
      touch
      wrap
      controls={false}
      indicators
      className="hero-carousel"
    >
      {heroSlides.map((slide, idx) => (
        <Carousel.Item key={idx}>
          <div className="hero-panel">
            <Row className="position-relative align-items-center">
              <Col lg={7} className="mb-4 mb-lg-0">
                <span className="hero-eyebrow mb-4">
                  <FiHeart size={13} /> {slide.eyebrow}
                </span>
                <h1 className="mb-3">{slide.title}</h1>
                <p className="hero-sub mb-4">{slide.sub}</p>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  <Link to={slide.primary.to}>
                    <Button variant="accent" size="lg" className="px-4 py-2 fw-semibold">
                      {slide.primary.label} <FiArrowRight className="ms-1" />
                    </Button>
                  </Link>
                  <Link to={slide.secondary.to}>
                    <Button
                      size="lg"
                      className="px-4 py-2 fw-semibold"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderColor: 'rgba(255,255,255,0.25)',
                        color: '#fff',
                      }}
                    >
                      {slide.secondary.label}
                    </Button>
                  </Link>
                </div>

                <div className="hero-trust">
                  {trustItems.map((item, i) => (
                    <div className="hero-trust-item" key={i}>
                      {item.icon} {item.label}
                    </div>
                  ))}
                </div>
              </Col>
              <Col xs={12} lg={5} className="text-center position-relative mt-4 mt-lg-0">
                <div
                  className="hero-3d-wrap"
                  style={{
                    transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                    transition: 'transform 0.4s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(1000px) rotateY(-15deg) rotateX(5deg)';
                  }}
                >
                  <img
                    src={slide.image}
                    alt={slide.imageAlt}
                    className="hero-feature-img"
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default HeroCarousel;
