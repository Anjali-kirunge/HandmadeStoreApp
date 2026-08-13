import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FaBox,
  FaBoxOpen,
  FaDownload,
  FaExclamationTriangle,
  FaMinus,
  FaPlus,
  FaPowerOff,
  FaRupeeSign,
  FaSyncAlt,
  FaTimes,
} from 'react-icons/fa';
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
const THRESHOLD_KEY = 'hm_inventory_threshold';

export default function Inventory() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [threshold, setThreshold] = useState(() => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    const parsed = saved === null ? Number.NaN : Number(saved);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
  });

  const [stockTarget, setStockTarget] = useState(null);
  const [stockQty, setStockQty] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const p = productApi.inventory(debouncedKeyword || null, status || null, page, PAGE_SIZE);
    const l = inventoryApi.lowStock();
    Promise.all([p, l])
      .then(([pRes, lRes]) => {
        setData(pRes.data);
        setLowStock(lRes.data);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedKeyword, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, status]);

  useEffect(() => {
    localStorage.setItem(THRESHOLD_KEY, String(threshold));
  }, [threshold]);

  const lowStockVisible = useMemo(
    () => (lowStock || []).filter((p) => p.stockQuantity <= threshold),
    [lowStock, threshold]
  );
  const outOfStockCount = useMemo(
    () => (lowStock || []).filter((p) => (p.stockQuantity ?? 0) === 0).length,
    [lowStock]
  );

  const stats = useMemo(() => {
    const rows = data?.content || [];
    const low = rows.filter((p) => {
      const qty = p.stockQuantity ?? 0;
      return qty > 0 && qty <= threshold;
    }).length;
    const oos = rows.filter((p) => (p.stockQuantity ?? 0) === 0).length;
    const value = rows.reduce(
      (sum, p) => sum + Number(p.discountPrice ?? p.price ?? 0) * (p.stockQuantity ?? 0),
      0
    );
    return { total: data?.totalElements ?? rows.length, low, oos, value };
  }, [data, threshold]);

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

  const restock = async (p) => {
    setSavingId(p.id);
    try {
      const qty = Math.max(threshold, p.stockQuantity ?? 0);
      await productApi.setStock(p.id, qty);
      toast.success(`"${p.name}" restocked to ${qty}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const toggleStatus = async (p) => {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSavingId(p.id);
    try {
      await productApi.setStatus(p.id, next);
      toast.success(`"${p.name}" is now ${next}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    const rows = data?.content || [];
    if (!rows.length) {
      toast.info('Nothing to export on this page');
      return;
    }
    const header = ['Name', 'SKU', 'Category', 'Price', 'Discount Price', 'Stock', 'Status'];
    const lines = rows.map((p) =>
      [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.sku || '').replace(/"/g, '""')}"`,
        `"${(p.category?.name || '').replace(/"/g, '""')}"`,
        p.price ?? '',
        p.discountPrice ?? '',
        p.stockQuantity ?? 0,
        p.status || '',
      ].join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Inventory exported as CSV');
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
        <div className="flex items-center gap-2" title="Low stock threshold">
          <span className="muted" style={{ fontSize: 12.5 }}>
            Low stock &le;
          </span>
          <input
            className="form-control"
            type="number"
            min="0"
            style={{ maxWidth: 72 }}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Low stock threshold"
          />
        </div>
        <button className="btn btn-outline" onClick={exportCsv} title="Export current view as CSV">
          <FaDownload />
          Export CSV
        </button>
      </PageHeader>

      <div
        className="grid-cols"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 20 }}
      >
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
            <FaBox />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="stat-value">{lowStockVisible.length}</div>
            <div className="stat-label">Low on stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <FaBoxOpen />
          </div>
          <div>
            <div className="stat-value">{outOfStockCount}</div>
            <div className="stat-label">Out of stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <FaRupeeSign />
          </div>
          <div>
            <div className="stat-value">{formatPrice(stats.value)}</div>
            <div className="stat-label">Stock value · this page</div>
          </div>
        </div>
      </div>

      {lowStockVisible.length > 0 && !alertDismissed && (
        <div
          className="card alert-card"
          style={{ borderColor: 'var(--warning)', borderLeft: '4px solid var(--warning)' }}
        >
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--warning)' }}>
              <FaExclamationTriangle size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong style={{ fontSize: 14 }}>
                {lowStockVisible.length} product{lowStockVisible.length > 1 ? 's' : ''} low on stock
              </strong>
              <div className="muted" style={{ fontSize: 12 }}>
                {lowStockVisible.map((p) => p.name).join(', ')}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setStatus('')}>
              View all
            </button>
            <button
              className="btn-ghost"
              onClick={() => setAlertDismissed(true)}
              aria-label="Dismiss low stock alert"
              title="Dismiss"
            >
              <FaTimes />
            </button>
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
                const isLow = qty > 0 && qty <= threshold;
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
                        disabled={savingId === p.id}
                      >
                        <FaPlus />
                        <FaMinus />
                      </button>
                      {qty < threshold && (
                        <button
                          className="btn-icon"
                          title={`Restock to ${threshold}`}
                          onClick={() => restock(p)}
                          disabled={savingId === p.id}
                        >
                          <FaSyncAlt />
                        </button>
                      )}
                      <button
                        className="btn-icon"
                        title={p.status === 'ACTIVE' ? 'Set inactive' : 'Set active'}
                        onClick={() => toggleStatus(p)}
                        disabled={savingId === p.id}
                      >
                        <FaPowerOff />
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
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Current stock: <strong>{stockTarget.stockQuantity ?? 0}</strong> · Low stock threshold:{' '}
              <strong>{threshold}</strong>
            </p>
            <div className="grid-cols" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => setStockQty((q) => Math.max(0, (Number(q) || 0) - 1))}
                aria-label="Decrease stock"
              >
                <FaMinus />
              </button>
              <input
                className="form-control"
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                aria-label="Stock quantity"
              />
              <button
                className="btn btn-outline"
                onClick={() => setStockQty((q) => (Number(q) || 0) + 1)}
                aria-label="Increase stock"
              >
                <FaPlus />
              </button>
            </div>
            <div className="grid-cols" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <button
                className="btn btn-outline"
                onClick={() => setStockQty(Math.max(0, (stockTarget.stockQuantity ?? 0) - 1))}
              >
                −1
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setStockQty(Math.max(0, (stockTarget.stockQuantity ?? 0) + 1))}
              >
                +1
              </button>
            </div>
            <div className="modal-footer" style={{ padding: '18px 0 0' }}>
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
