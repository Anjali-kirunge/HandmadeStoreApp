import { Component } from 'react';
import { Button } from 'react-bootstrap';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-secondary-subtle px-3">
          <div className="text-center" style={{ maxWidth: '500px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>😵</div>
            <h2 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
            <p className="text-muted mb-1">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-start mb-3 p-3 bg-body border rounded" style={{ fontSize: '0.8rem' }}>
                <summary className="fw-semibold text-muted" style={{ cursor: 'pointer' }}>
                  Error details
                </summary>
                <pre className="mt-2 text-danger mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button variant="brand" onClick={this.handleReset}>
                Go to Home
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
