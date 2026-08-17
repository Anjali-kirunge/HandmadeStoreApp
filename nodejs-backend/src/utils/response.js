function apiSuccess(message, data) {
  const body = { timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), message, success: true };
  if (data !== undefined) body.data = data;
  return body;
}

function apiError(message, errors) {
  const body = { timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), message, success: false };
  if (errors !== undefined) body.errors = errors;
  return body;
}

function pageResponse(content, pageNumber, pageSize, totalElements) {
  const totalPages = pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0;
  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    last: pageNumber >= totalPages - 1,
  };
}

function currentTimestamp() {
  return new Date();
}

function toDbDateTime(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

module.exports = { apiSuccess, apiError, pageResponse, currentTimestamp, toDbDateTime };
