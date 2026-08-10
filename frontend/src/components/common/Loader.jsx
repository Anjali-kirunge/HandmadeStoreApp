import { Spinner } from 'react-bootstrap';

const Loader = ({ size = 'sm' }) => (
  <Spinner animation="border" size={size} variant="light" />
);

export default Loader;
