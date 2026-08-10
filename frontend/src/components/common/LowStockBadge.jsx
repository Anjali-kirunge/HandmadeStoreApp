import { Badge } from 'react-bootstrap';

const LowStockBadge = ({ quantity }) => {
  if (quantity > 10) return null;
  if (quantity <= 0) return <Badge bg="danger">Out of Stock</Badge>;
  if (quantity <= 5) return <Badge bg="warning" text="dark">Only {quantity} left!</Badge>;
  return <Badge bg="info">Low Stock</Badge>;
};

export default LowStockBadge;
