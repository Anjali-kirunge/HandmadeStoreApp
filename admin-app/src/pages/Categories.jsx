import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { categoryApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { getErrorMessage } from '../utils/helpers';

const EMPTY_FORM = { name: '', description: '', imageUrl: '', parentId: '' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    categoryApi
      .list()
      .then((res) => setCategories(res.data || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentCategory ? String(cat.parentCategory) : '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      parentId: form.parentId ? Number(form.parentId) : null,
    };
    setSaving(true);
    try {
      if (editing) {
        await categoryApi.update(editing.id, payload);
        toast.success('Category updated');
      } else {
        await categoryApi.create(payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const result = await Swal.fire({
      title: 'Delete category?',
      text: `"${cat.name}" will be permanently removed. Products in this category may lose their category.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await categoryApi.remove(cat.id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Loading text="Loading categories…" />;

  const parentName = (id) => categories.find((c) => c.id === id)?.name || '—';
  const roots = categories.filter((c) => !c.parentCategory);

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organise products into categories and subcategories">
        <button className="btn btn-primary" onClick={openCreate}>
          <FaPlus /> New Category
        </button>
      </PageHeader>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Parent</th>
                <th>Image</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td className="muted">{cat.description || '—'}</td>
                  <td>{cat.parentCategory ? parentName(cat.parentCategory) : '—'}</td>
                  <td>
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="product-thumb" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-ghost" title="Edit" onClick={() => openEdit(cat)}>
                        <FaEdit />
                      </button>
                      <button className="btn-ghost" title="Delete" onClick={() => handleDelete(cat)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <EmptyState title="No categories yet" />}
        </div>
      </div>

      {roots.length === 0 && categories.length > 0 && (
        <p className="muted" style={{ fontSize: 12 }}>
          Tip: Create a parent category, then assign subcategories by choosing a parent.
        </p>
      )}

      {modalOpen && (
        <Modal
          title={editing ? 'Edit Category' : 'New Category'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          {formError && <div className="auth-error">{formError}</div>}
          <div className="form-group">
            <label className="form-label">
              Name <span className="required">*</span>
            </label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Home Decor"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Parent category</label>
            <select
              className="form-control"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">None (top level)</option>
              {categories
                .filter((c) => !editing || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              className="form-control"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
