import { Pagination as BSPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  let startPage = Math.max(0, currentPage - 2);
  let endPage = Math.min(totalPages - 1, currentPage + 2);

  if (currentPage <= 2) {
    endPage = Math.min(totalPages - 1, 4);
  }
  if (currentPage >= totalPages - 3) {
    startPage = Math.max(0, totalPages - 5);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="d-flex justify-content-center mt-4">
      <BSPagination>
        <BSPagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        />
        {startPage > 0 && (
          <>
            <BSPagination.Item onClick={() => onPageChange(0)}>
              1
            </BSPagination.Item>
            {startPage > 1 && <BSPagination.Ellipsis disabled />}
          </>
        )}
        {pages.map((page) => (
          <BSPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page + 1}
          </BSPagination.Item>
        ))}
        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && <BSPagination.Ellipsis disabled />}
            <BSPagination.Item onClick={() => onPageChange(totalPages - 1)}>
              {totalPages}
            </BSPagination.Item>
          </>
        )}
        <BSPagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
        />
      </BSPagination>
    </nav>
  );
};

export default Pagination;
