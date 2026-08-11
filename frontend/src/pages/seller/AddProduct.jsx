import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Button, Form, Image } from 'react-bootstrap';
import { FiX, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { createProduct } from '../../redux/slices/productsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);

  const mainImageRef = useRef(null);
  const additionalImagesRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    price: '',
    discountPrice: '',
    stockQuantity: '',
    featured: false,
  });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} is not a valid image`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setAdditionalImages((prev) => [...prev, ...validFiles]);
    setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.sku.trim()) newErrors.sku = 'SKU is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (form.stockQuantity === '' || form.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity is required (>= 0)';
    if (!form.categoryId) newErrors.categoryId = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('sku', form.sku.trim());
      formData.append('categoryId', form.categoryId);
      formData.append('price', form.price);
      if (form.discountPrice) formData.append('discountPrice', form.discountPrice);
      formData.append('stockQuantity', form.stockQuantity);
      formData.append('featured', form.featured);

      if (mainImage) {
        formData.append('mainImage', mainImage);
      }
      additionalImages.forEach((img) => {
        formData.append('images', img);
      });

      await dispatch(createProduct(formData)).unwrap();
      toast.success('Product created successfully!');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid>
      <Helmet>
        <title>Add Product - Handmade Store</title>
      </Helmet>

      <div className="mb-4">
        <h4 className="fw-bold">Add New Product</h4>
        <p className="text-muted mb-0">Fill in the details to list a new product</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Product Information</h6>
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">
                        Product Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        isInvalid={!!errors.name}
                        placeholder="e.g. Hand-painted Ceramic Vase"
                      />
                      <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe your product..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">
                        SKU <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="sku"
                        value={form.sku}
                        onChange={handleChange}
                        isInvalid={!!errors.sku}
                        placeholder="e.g. CERAMIC-VASE-001"
                      />
                      <Form.Control.Feedback type="invalid">{errors.sku}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">
                        Category <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        isInvalid={!!errors.categoryId}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.categoryId}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3">Pricing & Inventory</h6>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">
                        Price (₹) <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        isInvalid={!!errors.price}
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                      />
                      <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Discount Price (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        name="discountPrice"
                        value={form.discountPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">
                        Stock Quantity <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="stockQuantity"
                        value={form.stockQuantity}
                        onChange={handleChange}
                        isInvalid={!!errors.stockQuantity}
                        min="0"
                        placeholder="0"
                      />
                      <Form.Control.Feedback type="invalid">{errors.stockQuantity}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Check
                      type="checkbox"
                      label="Mark as Featured Product"
                      name="featured"
                      checked={form.featured}
                      onChange={handleChange}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Main Image</h6>
                <div
                  className="border border-2 border-dashed rounded-3 p-3 text-center cursor-pointer"
                  style={{ cursor: 'pointer' }}
                  onClick={() => mainImageRef.current?.click()}
                >
                  {mainImagePreview ? (
                    <div className="position-relative">
                      <Image
                        src={mainImagePreview}
                        alt="Main preview"
                        fluid
                        className="rounded"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainImage(null);
                          setMainImagePreview('');
                          if (mainImageRef.current) mainImageRef.current.value = '';
                        }}
                      >
                        <FiX size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <FiUpload size={32} className="text-muted mb-2" />
                      <p className="text-muted mb-0 small">Click to upload main image</p>
                      <p className="text-muted mb-0 small">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={mainImageRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleMainImageChange}
                />
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3">Additional Images</h6>
                <div
                  className="border border-2 border-dashed rounded-3 p-3 text-center mb-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => additionalImagesRef.current?.click()}
                >
                  <FiUpload size={24} className="text-muted mb-2" />
                  <p className="text-muted mb-0 small">Click to upload more images</p>
                </div>
                <input
                  ref={additionalImagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={handleAdditionalImagesChange}
                />

                {additionalPreviews.length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {additionalPreviews.map((preview, index) => (
                      <div key={index} className="position-relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ width: 72, height: 72, objectFit: 'cover' }}
                          className="rounded border"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0"
                          style={{ transform: 'translate(30%, -30%)', padding: '0 4px', lineHeight: '14px' }}
                          onClick={() => removeAdditionalImage(index)}
                        >
                          <FiX size={10} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-2 mt-4 mb-5">
          <Button variant="outline-secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="warning" type="submit" disabled={saving} className="px-4">
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default AddProduct;
