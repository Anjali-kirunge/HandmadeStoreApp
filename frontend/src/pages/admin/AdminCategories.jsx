import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Table, Modal, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiChevronDown } from "react-icons/fi";
import Swal from "sweetalert2";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../redux/slices/categoriesSlice";
import { formatDate } from "../../utils/helpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const AdminCategories = () => {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedParents, setExpandedParents] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    parentCategory: "",
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({ name: "", description: "", imageUrl: "", parentCategory: "" });
    setEditingCategory(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      parentCategory: cat.parentCategory?._id || cat.parentCategory || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.parentCategory) delete payload.parentCategory;

    if (editingCategory) {
      dispatch(updateCategory({ id: editingCategory._id, data: payload }));
    } else {
      dispatch(createCategory(payload));
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (cat) => {
    Swal.fire({
      title: "Delete Category?",
      text: `Are you sure you want to delete "${cat.name}"? Subcategories will also be affected.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteCategory(cat._id));
        Swal.fire("Deleted!", "Category has been deleted.", "success");
      }
    });
  };

  const toggleExpand = (catId) => {
    setExpandedParents((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const parentCategories = categories?.filter((c) => !c.parentCategory) ?? [];

  const buildTree = () => {
    const tree = [];
    categories?.forEach((cat) => {
      if (!cat.parentCategory) {
        tree.push({ ...cat, children: [] });
      }
    });
    categories?.forEach((cat) => {
      if (cat.parentCategory) {
        const parentId = cat.parentCategory?._id || cat.parentCategory;
        const parent = tree.find((p) => p._id === parentId);
        if (parent) {
          parent.children.push(cat);
        } else {
          tree.push({ ...cat, children: [], _orphan: true });
        }
      }
    });
    return tree;
  };

  const tree = buildTree();

  const renderRow = (cat, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedParents[cat._id];

    return (
      <React.Fragment key={cat._id}>
        <tr>
          <td>
            <div className="d-flex align-items-center" style={{ paddingLeft: depth * 24 }}>
              {hasChildren ? (
                <Button
                  variant="link"
                  className="p-0 me-2 text-decoration-none"
                  onClick={() => toggleExpand(cat._id)}
                >
                  {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </Button>
              ) : (
                <span className="me-3" />
              )}
              {cat.imageUrl && (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="rounded me-2"
                  width={32}
                  height={32}
                  style={{ objectFit: "cover" }}
                />
              )}
              <span className={depth > 0 ? "text-muted" : "fw-semibold"}>
                {cat.name}
              </span>
              {hasChildren && (
                <Badge bg="info" className="ms-2" pill>
                  {cat.children.length} sub
                </Badge>
              )}
            </div>
          </td>
          <td className="text-muted">{cat.description || "—"}</td>
          <td>{cat.productCount ?? 0}</td>
          <td className="text-muted">{formatDate(cat.createdAt)}</td>
          <td>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(cat)}>
                <FiEdit2 />
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cat)}>
                <FiTrash2 />
              </Button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && cat.children.map((child) => renderRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <>
      <Helmet>
        <title>Manage Categories</title>
      </Helmet>

      <Container fluid className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">Manage Categories</h2>
          <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleOpenAdd}>
            <FiPlus /> Add Category
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Products</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No categories found
                        </td>
                      </tr>
                    ) : (
                      tree.map((cat) => renderRow(cat, 0))
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? "Edit Category" : "Add Category"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Image URL</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Parent Category</Form.Label>
              <Form.Select
                value={formData.parentCategory}
                onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
              >
                <option value="">None (Top-level)</option>
                {parentCategories
                  .filter((c) => !editingCategory || c._id !== editingCategory._id)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default AdminCategories;
