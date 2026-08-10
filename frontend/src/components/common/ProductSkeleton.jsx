import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProductSkeleton = () => (
  <div className="product-card" aria-hidden="true">
    <div style={{ aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
      <Skeleton height="100%" style={{ lineHeight: 'unset' }} />
    </div>
    <div className="product-body" style={{ gap: '0.6rem' }}>
      <Skeleton width="30%" height={10} />
      <Skeleton width="85%" height={14} />
      <Skeleton width="45%" height={14} />
      <Skeleton width="40%" height={16} />
      <Skeleton height={40} borderRadius={8} />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="row g-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="col-lg-3 col-md-4 col-sm-6 col-6">
        <ProductSkeleton />
      </div>
    ))}
  </div>
);

export default ProductSkeleton;
