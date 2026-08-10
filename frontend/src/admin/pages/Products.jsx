import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBoxOpen, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { fetchFeaturedProducts, fetchProducts } from '../../redux/slices/productsSlice';
import { productApi, categoryApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatPrice, getErrorMessage, fullName } from '../utils/helpers';
import { PRODUCT_STATUSES } from '../utils/constants';

const PAGE_SIZE = 10;

export default function Products() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stockModal, setStockModal] = useState(null);
  const [stockValue, setStockValue] = useState(0);
  const [savingStock, setSavingStock] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    productApi
      .list(keyword || null, status || null, page, PAGE_SIZE)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [keyword, status, page]);

  useEffect(() => {
    const t = setTimeout(load, keyword ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, keyword]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      title: 'Delete product?',
      text: `"${product.name}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await productApi.remove(product.id);
      toast.success('Product deleted');
      dispatch(fetchCategories());
      dispatch(fetchFeaturedProducts());
      dispatch(fetchProducts({}));
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await productApi.toggleFeatured(product.id);
      toast.success(product.isFeatured ? 'Removed from featured' : 'Marked as featured');
      dispatch(fetchFeaturedProducts());
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openStock = (product) => {
    setStockModal(product);
    setStockValue(product.stockQuantity || 0);
  };

  const saveStock = async () => {
    if (stockValue == null || stockValue < 0) {
      toast.error('Stock cannot be negative');
      return;
    }
    setSavingStock(true);
    try {
      await productApi.setStock(stockModal.id, Number(stockValue));
      toast.success('Stock updated');
      setStockModal(null);
      dispatch(fetchProducts({}));
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div>
      <PageHeader title="Products" subtitle={`${data?.totalElements ?? 0} products in catalog`}>
        <button className="btn btn-primary" onClick={() => navigate('/admin/products/new')}>
          <FaPlus /> New Product
        </button>
      </PageHeader>

      <div className="premium-card animate-slide-down">
        <div className="card-header">
          <div className="filter-bar">
            <input
              className="form-control search-input"
              placeholder="Search by name or SKU…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Seller</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((p) => (
                <tr
                  key={p.id}
                  className="clickable"
                  onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl || '/uploads/placeholder.svg'}
                        alt={p.name}
                        className="product-thumb"
                        onError={(e) => {
                          e.target.src = '/uploads/placeholder.svg';
                        }}
                      />
                      <div className="min-w-0">
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div className="muted mono" style={{ fontSize: 11.5 }}>
                          {p.sku || '—'}
                        </div>
                        {p.isFeatured && (
                          <span className="badge" style={{ background: 'rgba(217,119,6,0.12)', color: '#b45309' }}>
                            <FaStar style={{ fontSize: 10 }} /> Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{p.category?.name || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{formatPrice(p.price)}</div>
                    {p.discountPrice && (
                      <div className="muted" style={{ fontSize: 11.5, textDecoration: 'line-through' }}>
                        {formatPrice(p.discountPrice)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          p.stockQuantity <= 5
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(16,185,129,0.12)',
                        color: p.stockQuantity <= 5 ? '#dc2626' : '#059669',
                      }}
                    >
                      {p.stockQuantity} in stock
                    </span>
                  </td>
                  <td>
                    <StatusBadge type="product" value={p.status} />
                  </td>
                  <td>{p.seller ? fullName(p.seller) : '—'}</td>
                  <td>
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-ghost"
                        title={p.isFeatured ? 'Unfeature' : 'Feature'}
                        onClick={() => handleToggleFeatured(p)}
                      >
                        {p.isFeatured ? <FaStar /> : <FaStarHalfAlt />}
                      </button>
                      <button className="btn-ghost" title="Stock" onClick={() => openStock(p)}>
                        <FaBoxOpen />
                      </button>
                      <button className="btn-ghost" title="Edit" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                        <FaEdit />
                      </button>
                      <button className="btn-ghost" title="Delete" onClick={() => handleDelete(p)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading products…" />}
          {!loading && (!data?.content || data.content.length === 0) && (
            <EmptyState title="No products found" description="Try adjusting your search or filters." />
          )}
        </div>

        {data && (
          <div style={{ padding: '0 20px 12px' }}>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {stockModal && (
        <Modal
          title={`Update stock — ${stockModal.name}`}
          onClose={() => setStockModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setStockModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveStock} disabled={savingStock}>
                {savingStock ? 'Saving…' : 'Save stock'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">New stock quantity</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={stockValue}
              onChange={(e) => setStockValue(Number(e.target.value))}
            />
            <p className="form-hint">Setting to 0 will mark the product as out of stock.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
