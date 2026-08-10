import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import ProductCard from '../product/ProductCard';
import { fetchProductsByCategory } from '../../redux/slices/productsSlice';
import { ProductGridSkeleton } from './ProductSkeleton';

const RecommendedProducts = ({ categoryId, currentProductId }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchProductsByCategory({ categoryId, page: 0, size: 8 }));
    }
  }, [categoryId, dispatch]);

  const filtered = products.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (!categoryId || filtered.length === 0) return null;

  return (
    <section className="mt-5">
      <h4 className="mb-4 fw-bold">You May Also Like</h4>
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <Row>
          {filtered.map((product) => (
            <Col key={product.id} lg={3} md={4} sm={6} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
};

export default RecommendedProducts;
