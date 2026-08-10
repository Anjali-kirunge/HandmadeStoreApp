import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages - 1, start + maxVisible - 1);
  start = Math.max(0, end - maxVisible + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div>
      <div className="pagination">
        <button
          className="page-btn"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <FaChevronLeft />
        </button>
        {start > 0 && (
          <>
            <button className="page-btn" onClick={() => onPageChange(0)}>
              1
            </button>
            {start > 1 && <span className="muted">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
        {end < totalPages - 1 && (
          <>
            {end < totalPages - 2 && <span className="muted">…</span>}
            <button className="page-btn" onClick={() => onPageChange(totalPages - 1)}>
              {totalPages}
            </button>
          </>
        )}
        <button
          className="page-btn"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <FaChevronRight />
        </button>
      </div>
      <div className="pagination-info">
        Page {page + 1} of {totalPages}
      </div>
    </div>
  );
}
