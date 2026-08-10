import { useEffect, useState, useCallback } from 'react';
import { FaStar, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { reviewApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { formatDateTime, fullName, getErrorMessage } from '../utils/helpers';

const PAGE_SIZE = 10;

function Stars({ rating }) {
  return (
    <span style={{ color: 'var(--warning)', whiteSpace: 'nowrap' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} size={11} color={i < rating ? 'var(--warning)' : 'var(--border)'} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    reviewApi
      .list(page, PAGE_SIZE)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewApi.remove(review.id);
      toast.success('Review deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle={`${data?.totalElements ?? 0} total reviews`} />

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{fullName(r.user)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <img
                        src={r.product?.imageUrl || '/uploads/placeholder.svg'}
                        alt={r.product?.name}
                        className="product-thumb"
                        onError={(e) => {
                          e.target.src = '/uploads/placeholder.svg';
                        }}
                      />
                      <div>
                        <div>{r.product?.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          #{r.product?.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Stars rating={r.rating} />
                  </td>
                  <td style={{ maxWidth: 320 }}>{r.comment || '—'}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(r)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading reviews…" />}
          {!loading && (!data?.content || data.content.length === 0) && <EmptyState title="No reviews yet" />}
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
