import { Container } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

const PrivacyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Handmade Store</title>
      </Helmet>
      <Container className="py-5">
        <div className="card p-4 p-md-5 border-0 shadow-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
          
          <div style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
            <p className="mb-4">
              <strong>Last updated: August 2026</strong>
            </p>
            
            <p>
              At Handmade Store, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or use our services.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>1. Information We Collect</h5>
            <p>
              We collect information that you provide directly to us when you create an account, make a purchase, subscribe to our newsletter, or contact customer support. This may include your name, email address, shipping address, billing address, and payment information. We also collect certain data automatically, such as your IP address, browser type, and browsing behavior on our site.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>2. How We Use Your Information</h5>
            <p>
              We use your information to process and fulfill your orders, communicate with you about your purchases, provide customer support, and send you promotional offers if you have opted in. We also use aggregated data to analyze website traffic and improve our user experience.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>3. Sharing Your Information</h5>
            <p>
              We do not sell your personal information to third parties. We may share your data with trusted service providers who assist us in operating our website, processing payments (such as Razorpay), and delivering packages (such as our courier partners). These partners are obligated to keep your information secure and confidential.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>4. Data Security</h5>
            <p>
              We implement industry-standard security measures, including encryption and secure socket layer (SSL) technology, to protect your personal and payment information from unauthorized access, alteration, or disclosure.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>5. Your Rights and Choices</h5>
            <p>
              You have the right to access, update, or delete your personal information by logging into your account settings. You can also opt out of receiving promotional emails by clicking the "unsubscribe" link in any of our marketing communications.
            </p>

            <h5 className="fw-bold mt-4 mb-3" style={{ color: 'var(--accent)' }}>6. Contact Us</h5>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at <a href="mailto:privacy@handmade.com" style={{ color: 'var(--brand-light)' }}>privacy@handmade.com</a>.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
};

export default PrivacyPage;
