import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { formatPrice, formatDateTime, fullName } from '../utils/helpers';
import { ORDER_STATUSES } from '../utils/constants';

const PAGE_SIZE = 10;

export default function Orders() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    orderApi
      .list(keyword || null, status || null, page, PAGE_SIZE)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyword, status, page]);

  useEffect(() => {
    const t = setTimeout(load, keyword ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, keyword]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${data?.totalElements ?? 0} total orders`} />

      <div className="card">
        <div className="card-header">
          <div className="filter-bar">
            <input
              className="form-control search-input"
              placeholder="Search by order #, customer name or email…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td className="mono">#{o.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.user ? fullName(o.user) : '—'}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {o.user?.email}
                    </div>
                  </td>
                  <td>{o.items?.length ?? 0}</td>
                  <td style={{ fontWeight: 700 }}>{formatPrice(o.totalAmount)}</td>
                  <td>
                    <StatusBadge type="payment" value={o.paymentStatus} />
                  </td>
                  <td>
                    <StatusBadge type="order" value={o.orderStatus} />
                  </td>
                  <td>{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading orders…" />}
          {!loading && (!data?.content || data.content.length === 0) && (
            <EmptyState title="No orders found" description="Try adjusting your search or status filter." />
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
