import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, InputGroup, Spinner, Image, ListGroup } from 'react-bootstrap';
import { FiSearch } from 'react-icons/fi';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/helpers';
import api from '../../services/api';

const SearchAutocomplete = ({ onSearch, className = '' }) => {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/products/search', {
        params: { keyword: searchTerm, page: 0, size: 5 },
      });
      setSuggestions(data.content || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedKeyword);
  }, [debouncedKeyword, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (productId) => {
    setIsOpen(false);
    setKeyword('');
    navigate(`/product/${productId}`);
  };

  const handleViewAll = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (onSearch) {
      onSearch(keyword);
    }
    navigate(`/shop?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setIsOpen(false);
      if (onSearch) {
        onSearch(keyword);
      }
      navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const showDropdown = isOpen && (keyword.trim().length >= 2 || suggestions.length > 0);

  return (
    <div ref={wrapperRef} className={`position-relative ${className}`} style={{ maxWidth: '500px', width: '100%' }}>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0">
            <FiSearch size={18} />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search handcrafted products..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => keyword.trim().length >= 2 && setIsOpen(true)}
            className="border-start-0"
            autoComplete="off"
          />
        </InputGroup>
      </Form>

      {showDropdown && (
        <ListGroup
          className="position-absolute w-100 shadow border-0 mt-1"
          style={{ zIndex: 1050, maxHeight: '400px', overflowY: 'auto' }}
        >
          {loading && (
            <ListGroup.Item className="d-flex align-items-center justify-content-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Searching...
            </ListGroup.Item>
          )}

          {!loading && suggestions.length === 0 && keyword.trim().length >= 2 && (
            <ListGroup.Item className="text-muted text-center py-3">
              No products found for "{keyword}"
            </ListGroup.Item>
          )}

          {!loading && suggestions.map((product) => (
            <ListGroup.Item
              key={product.id}
              action
              onClick={() => handleSelect(product.id)}
              className="d-flex align-items-center py-2"
            >
              <Image
                src={product.imageUrl || 'https://placehold.co/40x40/EEE/999?text=No+Image'}
                alt={product.name}
                width={40}
                height={40}
                rounded
                style={{ objectFit: 'cover' }}
                className="me-3 flex-shrink-0"
              />
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-medium text-truncate" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {product.name}
                </div>
                <div className="text-danger fw-bold" style={{ fontSize: '0.85rem' }}>
                  {formatPrice(product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price)}
                </div>
              </div>
            </ListGroup.Item>
          ))}

          {!loading && keyword.trim().length >= 2 && (
            <ListGroup.Item
              action
              onClick={handleViewAll}
              className="text-center text-primary fw-semibold py-2"
              style={{ fontSize: '0.9rem' }}
            >
              View all results for "{keyword}"
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
};

export default SearchAutocomplete;
