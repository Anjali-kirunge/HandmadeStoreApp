import { useEffect, useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import useRecentlyViewed from '../../hooks/useRecentlyViewed';
import ProductCard from '../product/ProductCard';
import api from '../../services/api';

const RecentlyViewed = () => {
  const { recentlyViewedIds } = useRecentlyViewed();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recentlyViewedIds.length === 0) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          recentlyViewedIds.map((id) => api.get(`/products/${id}`).then((res) => res.data))
        );
        setProducts(results);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [recentlyViewedIds]);

  if (recentlyViewedIds.length === 0) return null;

  return (
    <div className="my-5">
      <h4 className="mb-4 fw-bold">Recently Viewed</h4>
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
          <Row className="g-3 flex-nowrap" style={{ flexWrap: 'nowrap' }}>
            {products.map((product) => (
              <Col key={product.id} xs={6} sm={4} md={3} lg={2} style={{ minWidth: '220px', flex: '0 0 auto' }}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;
