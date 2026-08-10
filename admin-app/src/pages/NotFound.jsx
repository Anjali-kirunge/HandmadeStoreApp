import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center' }}>
      <h1 style={{ fontSize: 72, margin: 0, color: 'var(--brand-light)' }}>404</h1>
      <p className="muted">The page you're looking for doesn't exist.</p>
      <Link to="/admin" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
