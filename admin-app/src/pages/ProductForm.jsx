import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productApi, categoryApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import { getErrorMessage } from '../utils/helpers';

const EMPTY_FORM = {
  name: '',
  description: '',
  sku: '',
  price: '',
  discountPrice: '',
  stockQuantity: '',
  imageUrl: '',
  categoryId: '',
  isFeatured: false,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productApi
      .get(id)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          sku: p.sku || '',
          price: p.price != null ? String(p.price) : '',
          discountPrice: p.discountPrice != null ? String(p.discountPrice) : '',
          stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : '',
          imageUrl: p.imageUrl || '',
          categoryId: p.category?.id ? String(p.category.id) : '',
          isFeatured: Boolean(p.isFeatured),
        });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      sku: form.sku.trim() || null,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stockQuantity: form.stockQuantity !== '' ? Number(form.stockQuantity) : 0,
      imageUrl: form.imageUrl.trim() || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      isFeatured: form.isFeatured,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await productApi.update(id, payload);
        toast.success('Product updated');
      } else {
        await productApi.create(payload);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Loading product…" />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} subtitle="Fill in the product details below" />

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-body">
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Product name <span className="required">*</span>
              </label>
              <input className="form-control" value={form.name} onChange={set('name')} placeholder="e.g. Handwoven Jute Basket" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={set('description')} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={set('sku')} placeholder="HD-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.categoryId} onChange={set('categoryId')}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Price (₹) <span className="required">*</span>
                </label>
                <input type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={set('price')} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount price (₹)</label>
                <input type="number" min="0" step="0.01" className="form-control" value={form.discountPrice} onChange={set('discountPrice')} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock quantity</label>
                <input type="number" min="0" className="form-control" value={form.stockQuantity} onChange={set('stockQuantity')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input className="form-control" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://… or /uploads/…" />
              {form.imageUrl && (
                <div className="mt-2">
                  <img src={form.imageUrl} alt="Preview" className="product-thumb" style={{ width: 72, height: 72 }} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 clickable" style={{ fontWeight: 600, fontSize: 13 }}>
                <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} />
                Feature this product
              </label>
              <p className="form-hint">Featured products are highlighted on the storefront.</p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/products')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
