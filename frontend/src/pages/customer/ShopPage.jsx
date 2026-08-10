import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFilter, FiX, FiPackage } from 'react-icons/fi';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import ProductCard from '../../components/product/ProductCard';
import { ProductGridSkeleton } from '../../components/common/ProductSkeleton';
import Pagination from '../../components/common/Pagination';
import { ITEMS_PER_PAGE } from '../../utils/constants';

const FilterPanel = ({ categories, selectedCategories, onCategoryChange, minPrice, maxPrice, setMinPrice, setMaxPrice, onApplyPrice, sortBy, onSort, hasActiveFilters, onClear }) => (
  <div className="sidebar">
    <div className="d-flex align-items-center justify-content-between mb-3">
      <h5 className="mb-0 fw-bold">
        <FiFilter className="me-2" style={{ color: 'var(--brand-light)' }} />
        Filters
      </h5>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="btn btn-sm text-danger border-0 bg-transparent fw-semibold d-flex align-items-center gap-1"
        >
          <FiX /> Clear
        </button>
      )}
    </div>

    <div className="filter-group">
      <h6>Categories</h6>
      <div className="d-flex flex-column gap-2">
        {(categories || []).map((category) => (
          <Form.Check
            key={category.id}
            type="checkbox"
            id={`cat-${category.id}`}
            label={category.name}
            checked={selectedCategories.includes(String(category.id))}
            onChange={() => onCategoryChange(String(category.id))}
          />
        ))}
      </div>
    </div>

    <div className="filter-group">
      <h6>Price Range</h6>
      <div className="d-flex gap-2 mb-2">
        <Form.Control
          type="number"
          placeholder="Min ₹"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          size="sm"
        />
        <Form.Control
          type="number"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          size="sm"
        />
      </div>
      <Button variant="brand" size="sm" className="w-100" onClick={onApplyPrice}>
        Apply Price
      </Button>
    </div>

    <div className="filter-group mb-0">
      <h6>Sort By</h6>
      <Form.Select size="sm" value={sortBy} onChange={onSort}>
        <option value="">Default</option>
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Rating</option>
      </Form.Select>
    </div>
  </div>
);

const ShopPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, totalPages, currentPage, totalElements } = useSelector(
    (state) => state.products
  );
  const { categories } = useSelector((state) => state.categories);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categoryId') ? [searchParams.get('categoryId')] : []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(
    parseInt(searchParams.get('page')) || 0
  );

  const buildParams = useCallback(() => {
    const params = {
      page: currentPageNum,
      size: ITEMS_PER_PAGE,
    };
    const kw = searchParams.get('keyword');
    if (kw) params.keyword = kw;
    const catId = searchParams.get('categoryId');
    if (catId) params.categoryId = catId;
    const mp = searchParams.get('minPrice');
    if (mp) params.minPrice = mp;
    const xp = searchParams.get('maxPrice');
    if (xp) params.maxPrice = xp;
    const sb = searchParams.get('sortBy');
    if (sb) params.sortBy = sb;
    return params;
  }, [searchParams, currentPageNum]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts(buildParams()));
  }, [dispatch, buildParams]);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === 0) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPageNum(0);
    updateSearchParams({ keyword, page: 0 });
  };

  const handleCategoryChange = (categoryId) => {
    let updated;
    if (selectedCategories.includes(categoryId)) {
      updated = selectedCategories.filter((c) => c !== categoryId);
    } else {
      updated = [categoryId];
    }
    setSelectedCategories(updated);
    setCurrentPageNum(0);
    updateSearchParams({
      categoryId: updated.length > 0 ? updated[0] : '',
      page: 0,
    });
  };

  const handlePriceFilter = () => {
    setCurrentPageNum(0);
    updateSearchParams({
      minPrice,
      maxPrice,
      page: 0,
    });
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
    setCurrentPageNum(0);
    updateSearchParams({ sortBy: e.target.value, page: 0 });
  };

  const handlePageChange = (page) => {
    setCurrentPageNum(page);
    updateSearchParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
    setCurrentPageNum(0);
    setSearchParams({});
  };

  const hasActiveFilters =
    searchParams.get('keyword') ||
    searchParams.get('categoryId') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    searchParams.get('sortBy');

  const startResult = totalElements > 0 ? currentPage * ITEMS_PER_PAGE + 1 : 0;
  const endResult = Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements);

  return (
    <>
      <Helmet>
        <title>Shop - Handmade Store</title>
      </Helmet>

      <Container fluid="lg" className="py-4">
        <Row>
          {/* Desktop filters */}
          <div className="d-none d-lg-block" style={{ width: '260px', flex: '0 0 260px', maxWidth: '260px' }}>
            <FilterPanel
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              onApplyPrice={handlePriceFilter}
              sortBy={sortBy}
              onSort={handleSort}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
            />
          </div>

          <Col>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button
                variant="outline-dark"
                size="sm"
                className="d-lg-none"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="me-1" /> Filters
              </Button>
              <span className="text-muted small">
                {totalElements > 0
                  ? `Showing ${startResult}–${endResult} of ${totalElements} products`
                  : 'No products found'}
              </span>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="mb-3 d-lg-none">
                <FilterPanel
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  setMinPrice={setMinPrice}
                  setMaxPrice={setMaxPrice}
                  onApplyPrice={handlePriceFilter}
                  sortBy={sortBy}
                  onSort={handleSort}
                  hasActiveFilters={hasActiveFilters}
                  onClear={clearFilters}
                />
              </div>
            )}

            <form onSubmit={handleSearch} className="mb-4">
              <div className="nav-search w-100" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Search for handmade products..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ padding: '0.7rem 1rem' }}
                />
                <button type="submit" style={{ height: 48 }}>
                  <FiSearch size={18} />
                </button>
              </div>
            </form>

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <>
                {products && products.length > 0 ? (
                  <>
                    <Row className="g-3">
                      {products.map((product) => (
                        <Col key={product.id} lg={3} md={4} sm={6} xs={6}>
                          <ProductCard product={product} />
                        </Col>
                      ))}
                    </Row>
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FiPackage size={32} />
                    </div>
                    <h4>No products found</h4>
                    <p className="mb-3">Try adjusting your search or filter criteria</p>
                    <Button variant="brand" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ShopPage;
