import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', text = '', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" size={size === 'lg' ? 'lg' : undefined} />
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <Spinner animation="border" variant="primary" size={size === 'lg' ? 'lg' : undefined} />
      {text && <span className="ms-2 text-muted">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
