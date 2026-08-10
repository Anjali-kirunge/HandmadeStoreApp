import { useId } from 'react';

/**
 * Handmade Store brand logo.
 *
 * A rounded teal badge with a stitched "H" (two loom posts joined by a golden
 * thread) and a small needle — evoking handcrafted textiles. Renders an SVG
 * mark plus an optional Fraunces wordmark.
 *
 * Props:
 *  - size          : mark size in px (default 38)
 *  - showWordmark  : render the "HandmadeStore" wordmark (default true)
 *  - markAccent    : colour of the thread/needle inside the badge (default amber)
 *  - textAccent    : colour of the "Store" part of the wordmark (default var(--accent))
 *  - wordmarkStyle : extra inline styles for the wordmark (e.g. color for dark headers)
 */
const Logo = ({
  size = 38,
  showWordmark = true,
  markAccent = '#fbbf24',
  textAccent = 'var(--accent)',
  wordmarkStyle = {},
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `hm-badge-grad-${uid}`;

  return (
    <span
      className="hm-logo"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0f766e" />
            <stop offset="1" stopColor="#134e4a" />
          </linearGradient>
        </defs>

        <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill={`url(#${gradientId})`} />
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="12"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
        />

        {/* Loom posts forming the "H" */}
        <path
          d="M15 13v22"
          stroke="#fdf6ec"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M33 13v22"
          stroke="#fdf6ec"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Stitched thread crossbar */}
        <path
          d="M15 24h18"
          stroke={markAccent}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Needle and thread eye */}
        <path
          d="M34.5 13.5l6-6"
          stroke={markAccent}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle
          cx="41.8"
          cy="6.2"
          r="2.3"
          stroke={markAccent}
          strokeWidth="2"
        />
      </svg>

      {showWordmark && (
        <span
          className="hm-wordmark"
          style={{ color: 'inherit', ...wordmarkStyle }}
        >
          Handmade<span style={{ color: textAccent }}>Store</span>
        </span>
      )}
    </span>
  );
};

export default Logo;
