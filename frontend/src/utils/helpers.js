export function formatPrice(amount) {
  if (amount == null) return '₹0';
  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getDiscountedPrice(price, discountPrice) {
  if (!discountPrice || !price) return 0;
  const savings = ((price - discountPrice) / price) * 100;
  return Math.round(savings);
}

export function getStatusBadgeClass(status) {
  const map = {
    PENDING: 'bg-warning text-dark',
    CONFIRMED: 'bg-info text-dark',
    SHIPPED: 'bg-primary',
    OUT_FOR_DELIVERY: 'bg-info',
    DELIVERED: 'bg-success',
    CANCELLED: 'bg-danger',
    RETURNED: 'bg-secondary',
    REFUNDED: 'bg-dark',
    ACTIVE: 'bg-success',
    INACTIVE: 'bg-secondary',
    OUT_OF_STOCK: 'bg-warning text-dark',
    DISCONTINUED: 'bg-danger',
  };
  return map[status] || 'bg-secondary';
}

export function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateStars(rating) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  if (hasHalf) {
    stars.push('half');
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push('empty');
  }
  return stars;
}
