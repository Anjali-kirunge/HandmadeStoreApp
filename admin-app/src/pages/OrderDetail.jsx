import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaFileDownload, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { orderApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, formatDateTime, fullName, getErrorMessage } from '../utils/helpers';
import { ORDER_STATUSES } from '../utils/constants';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');

  useEffect(() => {
    orderApi
      .get(id)
      .then((res) => {
        setOrder(res.data);
        setStatus(res.data.orderStatus || '');
        setTracking(res.data.trackingNumber || '');
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!status) return;
    setSaving(true);
    try {
      const res = await orderApi.updateStatus(id, status, tracking || null);
      setOrder(res.data);
      setStatus(res.data.orderStatus);
      setTracking(res.data.trackingNumber || '');
      toast.success('Order status updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleInvoice = async () => {
    try {
      await orderApi.downloadInvoice(id);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Loading text="Loading order…" />;
  if (!order) return <EmptyState title="Order not found" />;

  const items = order.items || [];

  return (
    <div>
      <PageHeader title={`Order #${order.id}`} subtitle={formatDateTime(order.createdAt)}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/orders')}>
          <FaArrowLeft /> Back
        </button>
        <button className="btn btn-accent btn-sm" onClick={handleInvoice}>
          <FaFileDownload /> Invoice
        </button>
      </PageHeader>

      <div className="grid-cols grid-cols-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer</h3>
          </div>
          <div className="card-body">
            {order.user ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{fullName(order.user)}</div>
                <div className="muted">{order.user.email}</div>
                {order.user.phone && <div className="muted">{order.user.phone}</div>}
                <button
                  className="btn btn-outline btn-sm mt-3"
                  onClick={() => navigate(`/admin/users/${order.user.id}`)}
                >
                  View profile
                </button>
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Shipping Address</h3>
          </div>
          <div className="card-body">
            <p style={{ whiteSpace: 'pre-line' }}>{order.shippingAddress || '—'}</p>
            {order.trackingNumber && (
              <div className="mt-3">
                <div className="detail-label">Tracking number</div>
                <div className="mono">{order.trackingNumber}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Update Status</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Order status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tracking number</label>
              <input
                className="form-control"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleUpdateStatus} disabled={saving}>
              {saving ? 'Saving…' : 'Update status'}
            </button>
            <div className="mt-3 flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Current:
              </span>
              <StatusBadge type="order" value={order.orderStatus} />
              <StatusBadge type="payment" value={order.paymentStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Items ({items.length})</h3>
          <div className="flex items-center gap-2" style={{ fontWeight: 700 }}>
            <FaRupeeSign /> {formatPrice(order.totalAmount)}
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.imageUrl || '/uploads/placeholder.svg'}
                        alt={item.product?.name}
                        className="product-thumb"
                        onError={(e) => {
                          e.target.src = '/uploads/placeholder.svg';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>
                          {item.product?.category?.name || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{formatPrice(item.price && item.quantity ? item.price / item.quantity : 0)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
