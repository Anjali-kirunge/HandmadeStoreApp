import { Container } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | Handmade Store</title>
      </Helmet>
      <Container className="py-5">
        <div className="card p-4 p-md-5 border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Terms & Conditions</h1>
          
          <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
            <p className="mb-4">
              <strong>Last updated: August 2026</strong>
            </p>
            
            <p>
              Welcome to Handmade Store. By accessing or using our website, you agree to be bound by these Terms and Conditions. Please read them carefully before making any purchases or using our services.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>1. Use of the Platform</h5>
            <p>
              You must be at least 18 years old to create an account and make purchases on our platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>2. Product Information & Pricing</h5>
            <p>
              Because our products are handmade, slight variations in color, texture, and size may occur. We make every effort to display the products as accurately as possible, but we cannot guarantee that your device's display will perfectly reflect the actual product. Prices are subject to change without notice.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>3. Orders and Payments</h5>
            <p>
              When you place an order, you agree to provide current, complete, and accurate purchase and account information. We reserve the right to refuse or cancel any order for reasons including but not limited to product availability, errors in the description or price, or suspected fraud.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>4. Returns and Refunds</h5>
            <p>
              We offer a 7-day hassle-free return policy for most items in their original condition. Customized or personalized items may not be eligible for returns. Please refer to our detailed Return Policy page for specific instructions and exceptions.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>5. Intellectual Property</h5>
            <p>
              All content on this website, including text, graphics, logos, images, and software, is the property of Handmade Store or our sellers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>6. Changes to Terms</h5>
            <p>
              We reserve the right to update or modify these Terms and Conditions at any time. Your continued use of the website following any changes constitutes your acceptance of the new terms.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default TermsPage;
