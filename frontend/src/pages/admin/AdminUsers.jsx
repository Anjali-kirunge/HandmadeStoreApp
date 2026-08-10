import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Table, Badge, Modal } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useDispatch, useSelector } from "react-redux";
import { FiEdit2, FiUserCheck, FiUserX } from "react-icons/fi";
import { fetchAllUsers, toggleUserEnabled, updateUserRole } from "../../redux/slices/adminSlice";
import { ROLES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ROLE_BADGE_MAP = {
  customer: "primary",
  seller: "success",
  admin: "danger",
};

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, totalPages, loading } = useSelector((state) => state.admin);
  const usersPagination = totalPages > 0 ? { totalPages } : null;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUsers({ page: currentPage, search, role: roleFilter, status: statusFilter }));
  }, [dispatch, currentPage, search, roleFilter, statusFilter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (selectedUser && newRole) {
      dispatch(updateUserRole({ id: selectedUser._id, role: newRole }));
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  const openDisableModal = (user) => {
    setUserToToggle(user);
    setShowDisableModal(true);
  };

  const handleConfirmToggle = () => {
    if (userToToggle) {
      dispatch(toggleUserEnabled(userToToggle._id));
      setShowDisableModal(false);
      setUserToToggle(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Users</title>
      </Helmet>

      <Container fluid className="py-4">
        <h2 className="mb-4 fw-bold">Manage Users</h2>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <Form.Label className="fw-semibold">Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Role</Form.Label>
                <Form.Select value={roleFilter} onChange={handleRoleFilter}>
                  <option value="">All Roles</option>
                  {Object.values(ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label className="fw-semibold">Status</Form.Label>
                <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </Form.Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users?.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                alt={user.name}
                                className="rounded-circle"
                                width={36}
                                height={36}
                              />
                              <span className="fw-semibold">{user.name}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.phone || "—"}</td>
                          <td>
                            <Badge bg={ROLE_BADGE_MAP[user.role] || "secondary"} className="text-capitalize">
                              {user.role}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={user.isEnabled !== false ? "success" : "danger"}>
                              {user.isEnabled !== false ? "Active" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="text-muted">{formatDate(user.createdAt)}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openRoleModal(user)}
                                title="Edit Role"
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant={user.isEnabled !== false ? "outline-danger" : "outline-success"}
                                size="sm"
                                onClick={() => openDisableModal(user)}
                                title={user.isEnabled !== false ? "Disable" : "Enable"}
                              >
                                {user.isEnabled !== false ? <FiUserX /> : <FiUserCheck />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {usersPagination && usersPagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={usersPagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Container>

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Change role for <strong>{selectedUser?.name}</strong>
          </p>
          <Form.Label className="fw-semibold">Select Role</Form.Label>
          <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveRole}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDisableModal} onHide={() => setShowDisableModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {userToToggle?.isEnabled !== false ? "Disable User" : "Enable User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to{" "}
          <strong>{userToToggle?.isEnabled !== false ? "disable" : "enable"}</strong>{" "}
          user <strong>{userToToggle?.name}</strong>?
          {userToToggle?.isEnabled !== false && (
            <p className="text-danger mt-2 mb-0 small">
              This will prevent the user from logging in.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisableModal(false)}>
            Cancel
          </Button>
          <Button
            variant={userToToggle?.isEnabled !== false ? "danger" : "success"}
            onClick={handleConfirmToggle}
          >
            {userToToggle?.isEnabled !== false ? "Disable" : "Enable"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminUsers;
