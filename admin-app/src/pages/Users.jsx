import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaBan, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { userApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { fullName, formatDate, getErrorMessage } from '../utils/helpers';
import { ROLES } from '../utils/constants';

const PAGE_SIZE = 10;

export default function Users() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    userApi
      .list(keyword || null, page, PAGE_SIZE)
      .then((res) => {
        let users = res.data.content || [];
        if (role) users = users.filter((u) => u.role === role);
        setData({ ...res.data, content: users, totalElements: res.data.totalElements });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [keyword, role, page]);

  useEffect(() => {
    const t = setTimeout(load, keyword ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, keyword]);

  useEffect(() => {
    setPage(0);
  }, [role]);

  const handleToggle = async (user) => {
    const action = user.enabled ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} user?`,
      text: `${fullName(user)} (${user.email}) will be ${action === 'deactivate' ? 'blocked from signing in' : 'allowed to sign in again'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'deactivate' ? 'Yes, deactivate' : 'Yes, activate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: action === 'deactivate' ? '#ef4444' : '#10b981',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.toggle(user.id);
      toast.success(`User ${action}d`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Delete user?',
      text: `${fullName(user)} (${user.email}) will be permanently removed. Users with order history cannot be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.remove(user.id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const initials = (u) => `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div>
      <PageHeader title="Users" subtitle={`${data?.totalElements ?? 0} registered users`} />

      <div className="card">
        <div className="card-header">
          <div className="filter-bar">
            <input
              className="form-control search-input"
              placeholder="Search by name or email…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace('ROLE_', '').toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar-sm">{initials(u)}</div>
                      <div style={{ fontWeight: 600 }}>{fullName(u)}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <StatusBadge type="role" value={u.role} />
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: u.enabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: u.enabled ? '#059669' : '#dc2626',
                      }}
                    >
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" title="View" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <FaEye />
                      </button>
                      <button
                        className="btn-ghost"
                        title={u.enabled ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggle(u)}
                      >
                        {u.enabled ? <FaBan /> : <FaCheckCircle />}
                      </button>
                      {u.role !== 'ROLE_ADMIN' && (
                        <button className="btn-ghost" title="Delete" onClick={() => handleDelete(u)}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading users…" />}
          {!loading && (!data?.content || data.content.length === 0) && (
            <EmptyState title="No users found" description="Try adjusting your search or role filter." />
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
