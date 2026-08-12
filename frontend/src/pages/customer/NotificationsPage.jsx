import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../redux/slices/notificationsSlice';
import { FiBell, FiCheckCircle, FiCircle, FiInfo } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, loading, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (loading && notifications.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Helmet>
        <title>Notifications | Handmade Store</title>
      </Helmet>
      
      <Container className="py-4 py-lg-5" style={{ maxWidth: '800px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <FiBell className="text-primary" /> Notifications
            {unreadCount > 0 && <Badge bg="danger" pill className="ms-2">{unreadCount}</Badge>}
          </h2>
          {unreadCount > 0 && (
            <Button variant="outline-primary" size="sm" onClick={handleMarkAllAsRead} className="d-flex align-items-center gap-1">
              <FiCheckCircle size={16} /> Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: 'var(--radius-lg)' }}>
            <Card.Body>
              <div className="mb-3">
                <FiBell size={48} style={{ color: 'var(--border-color)' }} />
              </div>
              <h5 className="fw-semibold">No notifications yet</h5>
              <p className="text-muted mb-0">We'll let you know when something important happens.</p>
            </Card.Body>
          </Card>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-0 shadow-sm notification-card ${!notification.read ? 'unread' : ''}`}
                style={{ 
                  borderRadius: 'var(--radius-md)',
                  borderLeft: !notification.read ? '4px solid var(--primary-color)' : '4px solid transparent',
                  cursor: notification.link ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  backgroundColor: !notification.read ? 'var(--bg-soft)' : 'var(--card-bg)'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <Card.Body className="p-3 p-md-4">
                  <Row className="align-items-start g-3">
                    <Col xs="auto">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: !notification.read ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-body)',
                          color: !notification.read ? 'var(--primary-color)' : 'var(--text-secondary)'
                        }}
                      >
                        <FiInfo size={20} />
                      </div>
                    </Col>
                    <Col>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className={`mb-1 ${!notification.read ? 'fw-bold' : 'fw-semibold'}`}>
                            {notification.title}
                          </h6>
                          <p className="text-secondary mb-1" style={{ fontSize: '0.95rem' }}>
                            {notification.message}
                          </p>
                          <small className="text-muted">
                            {formatDate(notification.createdAt)}
                          </small>
                        </div>
                        {!notification.read && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 text-primary d-flex align-items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            <FiCircle fill="currentColor" size={12} />
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
};

export default NotificationsPage;
