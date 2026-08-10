import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - Handmade Store</title>
      </Helmet>

      <Container
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: '70vh' }}
      >
        <div className="text-center">
          <h1
            className="fw-bold mb-0"
            style={{
              fontSize: '8rem',
              color: 'var(--brand)',
              lineHeight: 1,
            }}
          >
            404
          </h1>
          <h3 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Page Not Found
          </h3>
          <p className="text-muted mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          <Link to="/">
            <Button
              size="lg"
              className="px-5 py-2 fw-semibold btn-brand"
            >
              <FiHome className="me-2" /> Go Home
            </Button>
          </Link>
        </div>
      </Container>
    </>
  );
};

export default NotFoundPage;
