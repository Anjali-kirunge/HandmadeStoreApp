import '@testing-library/jest-dom';

if (typeof window.scrollTo !== 'function') {
  window.scrollTo = () => {};
}
