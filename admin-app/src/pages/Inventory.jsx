import { useEffect, useState, useCallback } from 'react';
import { FaExclamationTriangle, FaMinus, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { productApi, inventoryApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, getErrorMessage } from '../utils/helpers';
import { PRODUCT_STATUSES } from '../utils/constants';

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 5;

export default function Inventory() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockQty, setStockQty] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const p = productApi.inventory(keyword || null, status || null, page, PAGE_SIZE);
    const l = inventoryApi.lowStock();
    Promise.all([p, l])
      .then(([pRes, lRes]) => {
        setData(pRes.data);
        setLowStock(lRes.data);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [keyword, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [keyword, status]);

  const adjustStock = async (delta) => {
    const target = stockTarget;
    const qty = Math.max(0, (target.stockQuantity || 0) + delta);
    try {
      await productApi.setStock(target.id, qty);
      toast.success('Stock updated');
      setStockTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const setExactStock = async () => {
    const target = stockTarget;
    try {
      await productApi.setStock(target.id, Math.max(0, Number(stockQty) || 0));
      toast.success('Stock updated');
      setStockTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`${data?.totalElements ?? 0} products`}>
        <input
          className="form-control"
          style={{ maxWidth: 220 }}
          placeholder="Search by name / SKU"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="card alert-card" style={{ borderColor: 'var(--warning)', borderLeft: '4px solid var(--warning)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--warning)' }}>
              <FaExclamationTriangle size={20} />
            </span>
            <div>
              <strong style={{ fontSize: 14 }}>
                {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock
              </strong>
              <div className="muted" style={{ fontSize: 12 }}>
                {lowStock.map((p) => p.name).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((p) => {
                const qty = p.stockQuantity ?? 0;
                const isLow = qty <= LOW_STOCK_THRESHOLD;
                return (
                  <tr key={p.id}>
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
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div className="muted" style={{ fontSize: 11.5 }}>
                            {p.category?.name || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{p.sku || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(p.discountPrice || p.price)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: qty === 0 ? 'var(--danger-bg)' : isLow ? 'var(--warning-bg)' : 'var(--success-bg)',
                          color: qty === 0 ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)',
                        }}
                      >
                        {qty} {qty === 0 ? '· out of stock' : isLow ? '· low' : ''}
                      </span>
                    </td>
                    <td>
                      <StatusBadge type="product" value={p.status} />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn-icon"
                        title="Adjust stock"
                        onClick={() => {
                          setStockTarget(p);
                          setStockQty(p.stockQuantity ?? 0);
                        }}
                      >
                        <FaPlus />
                        <FaMinus />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <Loading text="Loading inventory…" />}
          {!loading && (!data?.content || data.content.length === 0) && <EmptyState title="No products found" />}
        </div>

        {data && (
          <div style={{ padding: '0 20px 12px' }}>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={!!stockTarget} onClose={() => setStockTarget(null)} title={`Adjust stock — ${stockTarget?.name || ''}`}>
        {stockTarget && (
          <>
            <div className="grid-cols" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={() => setStockQty((q) => Math.max(0, q - 1))}>
                <FaMinus />
              </button>
              <input
                className="form-control"
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
              />
              <button className="btn btn-outline" onClick={() => setStockQty((q) => Number(q) + 1)}>
                <FaPlus />
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setStockTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={setExactStock}>
                Set stock
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
