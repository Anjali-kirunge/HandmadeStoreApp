import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, formatDateTime, fullName } from '../utils/helpers';
import { PAYMENT_STATUSES } from '../utils/constants';

const PAGE_SIZE = 10;

export default function Payments() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    paymentApi
      .list(status || null, page, PAGE_SIZE)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  return (
    <div>
      <PageHeader title="Payments" subtitle={`${data?.totalElements ?? 0} payment records`}>
        <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((p) => (
                <tr key={p.id}>
                  <td className="mono">#{p.id}</td>
                  <td>
                    <span
                      className="clickable mono"
                      style={{ color: 'var(--brand-light)' }}
                      onClick={() => p.orderId && navigate(`/admin/orders/${p.orderId}`)}
                    >
                      #{p.orderId || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.user ? fullName(p.user) : '—'}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {p.user?.email}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatPrice(p.amount)}</td>
                  <td>{p.paymentMethod || '—'}</td>
                  <td>
                    <StatusBadge type="payment" value={p.paymentStatus} />
                  </td>
                  <td>{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading payments…" />}
          {!loading && (!data?.content || data.content.length === 0) && (
            <EmptyState title="No payments found" />
          )}
        </div>

        {data && (
          <div style={{ padding: '0 20px 12px' }}>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
