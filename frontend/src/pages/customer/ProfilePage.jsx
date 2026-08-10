import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Modal, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiUser, FiMapPin, FiLock, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchProfile, updateProfile, changePassword } from '../../redux/slices/userSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state) => state.user);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false,
  });
  const [editingAddress, setEditingAddress] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || profile.phoneNumber || '',
      });
      setAddresses(profile.addresses || []);
    }
  }, [profile]);

  const handleProfileSave = () => {
    dispatch(updateProfile(profileForm))
      .unwrap()
      .then(() => toast.success('Profile updated successfully!'))
      .catch((err) => toast.error(err || 'Failed to update profile'));
  };

  const evaluatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    if (name === 'newPassword') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const handleSubmitPassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    dispatch(
      changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength(0);
      })
      .catch((err) => toast.error(err || 'Failed to change password'));
  };

  const handleAddressSubmit = () => {
    const newAddresses = [...addresses];
    if (editingAddress !== null) {
      newAddresses[editingAddress] = addressForm;
    } else {
      if (addressForm.isDefault) {
        newAddresses.forEach((a) => (a.isDefault = false));
      }
      newAddresses.push(addressForm);
    }
    setAddresses(newAddresses);
    setShowAddressModal(false);
    setAddressForm({ street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });
    setEditingAddress(null);
    toast.success(editingAddress !== null ? 'Address updated!' : 'Address added!');
  };

  const handleEditAddress = (index) => {
    setAddressForm(addresses[index]);
    setEditingAddress(index);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (index) => {
    const newAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(newAddresses);
    toast.success('Address removed');
  };

  const handleSetDefault = (index) => {
    const newAddresses = addresses.map((a, i) => ({ ...a, isDefault: i === index }));
    setAddresses(newAddresses);
    toast.success('Default address updated');
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['', 'var(--danger)', 'var(--warning)', 'var(--accent)', 'var(--info)', 'var(--success)'];

  if (loading && !profile) return <LoadingSpinner />;

  return (
    <>
      <Helmet>
        <title>My Profile - Handmade Store</title>
      </Helmet>

      <Container className="py-4">
        <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          My Profile
        </h2>

        <Row>
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm text-center p-4">
              <div
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: 'var(--brand)',
                  color: 'var(--accent)',
                  fontSize: '2.5rem',
                }}
              >
                {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h5 className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                {profile?.firstName} {profile?.lastName}
              </h5>
              <p className="text-muted mb-0">{profile?.email}</p>
            </Card>
          </Col>

          <Col lg={9}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Tabs defaultActiveKey="profile" className="mb-3">
                  <Tab
                    eventKey="profile"
                    title={
                      <span>
                        <FiUser className="me-1" /> Profile
                      </span>
                    }
                  >
                    <Row className="mt-3">
                      <Col md={6} className="mb-3">
                        <Form.Label className="fw-semibold">First Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, firstName: e.target.value })
                          }
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className="fw-semibold">Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, lastName: e.target.value })
                          }
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className="fw-semibold">Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={profileForm.email}
                          readOnly
                          plaintext
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Label className="fw-semibold">Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          placeholder="Enter phone number"
                        />
                      </Col>
                    </Row>
                    <Button
                      onClick={handleProfileSave}
                      disabled={loading}
                      style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
                      className="px-4"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Tab>

                  <Tab
                    eventKey="addresses"
                    title={
                      <span>
                        <FiMapPin className="me-1" /> Addresses
                      </span>
                    }
                  >
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Saved Addresses</h6>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAddressForm({
                              street: '',
                              city: '',
                              state: '',
                              zipCode: '',
                              country: 'India',
                              isDefault: false,
                            });
                            setEditingAddress(null);
                            setShowAddressModal(true);
                          }}
                          style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
                        >
                          <FiPlus className="me-1" /> Add Address
                        </Button>
                      </div>

                      {addresses.length > 0 ? (
                        addresses.map((addr, index) => (
                          <Card key={index} className="mb-3 border">
                            <Card.Body className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="mb-1">{addr.street}, {addr.city}</p>
                                <p className="mb-1">{addr.state} - {addr.zipCode}</p>
                                <p className="mb-0 text-muted">{addr.country}</p>
                                {addr.isDefault && (
                                  <Badge bg="success" className="mt-1">Default</Badge>
                                )}
                              </div>
                              <div className="d-flex gap-1">
                                {!addr.isDefault && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleSetDefault(index)}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  variant="outline-dark"
                                  size="sm"
                                  onClick={() => handleEditAddress(index)}
                                >
                                  <FiEdit2 />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteAddress(index)}
                                >
                                  <FiTrash2 />
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <FiMapPin size={40} className="mb-2" />
                          <p>No addresses saved yet</p>
                        </div>
                      )}
                    </div>
                  </Tab>

                  <Tab
                    eventKey="password"
                    title={
                      <span>
                        <FiLock className="me-1" /> Change Password
                      </span>
                    }
                  >
                    <div className="mt-3" style={{ maxWidth: '500px' }}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                        />
                        {passwordForm.newPassword && (
                          <div className="mt-2">
                            <div
                              className="mb-1"
                              style={{ height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${(passwordStrength / 5) * 100}%`,
                                  backgroundColor: strengthColors[passwordStrength],
                                  borderRadius: '3px',
                                  transition: 'width 0.3s, background-color 0.3s',
                                }}
                              />
                            </div>
                            <small style={{ color: strengthColors[passwordStrength] }}>
                              {strengthLabels[passwordStrength]}
                            </small>
                          </div>
                        )}
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          isInvalid={
                            passwordForm.confirmPassword &&
                            passwordForm.newPassword !== passwordForm.confirmPassword
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match
                        </Form.Control.Feedback>
                      </Form.Group>
                      <Button
                        onClick={handleSubmitPassword}
                        disabled={loading}
                        style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
                        className="px-4"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {editingAddress !== null ? 'Edit Address' : 'Add New Address'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Street Address *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter street address"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">City *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">State *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </Col>
            </Row>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">ZIP Code *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="ZIP Code"
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">Country</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                />
              </Col>
            </Row>
            <Form.Check
              type="checkbox"
              label="Set as default address"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddressModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddressSubmit}
            style={{ backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' }}
          >
            {editingAddress !== null ? 'Update Address' : 'Add Address'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProfilePage;
