import { Container, Row, Col } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Handmade Store</title>
      </Helmet>
      <Container className="py-5">
        <div className="card p-4 p-md-5 border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>About Handmade Store</h1>
          
          <Row className="gy-4">
            <Col lg={7}>
              <h4 className="fw-bold mb-3" style={{ color: 'var(--accent)' }}>Our Story</h4>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                Founded with a deep appreciation for craftsmanship, Handmade Store began as a small initiative to connect local artisans with a global audience. We recognized that in a world of mass-produced goods, there is a profound beauty in items crafted by human hands, carrying the stories and heritage of their makers.
              </p>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                Over the years, we have grown into a curated marketplace that empowers creators from diverse backgrounds. Our platform is dedicated to celebrating traditional techniques, sustainable practices, and the unique imperfections that make handmade products truly one-of-a-kind.
              </p>

              <h4 className="fw-bold mb-3 mt-4" style={{ color: 'var(--accent)' }}>Our Mission</h4>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                Our mission is to foster a vibrant community where artistry is valued and creators can thrive. We are committed to providing a transparent, fair, and supportive environment for our sellers while offering our customers authentic, high-quality handmade products that they can cherish for a lifetime.
              </p>
              <ul style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }} className="mb-0">
                <li>Supporting independent artisans and small businesses.</li>
                <li>Promoting sustainable and ethically sourced materials.</li>
                <li>Preserving traditional crafting techniques.</li>
                <li>Delivering exceptional quality and unique designs.</li>
              </ul>
            </Col>
            <Col lg={5}>
              <img 
                src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80" 
                alt="Artisan crafting" 
                className="img-fluid rounded-4 shadow"
                style={{ objectFit: 'cover', height: '100%', minHeight: '300px' }}
              />
            </Col>
          </Row>

          <hr className="my-5" />

          <div className="text-center">
            <h4 className="fw-bold mb-3">Join Our Community</h4>
            <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
              Whether you are a creator looking to share your work or a shopper seeking something special, you belong here.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default AboutPage;
