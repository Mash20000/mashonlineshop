// Mash Online Shop logo: an orange rounded badge with a shopping bag and an "M".
export default function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Mash Online Shop logo">
      <defs>
        <linearGradient id="mash-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#mash-logo-gradient)" />
      <path d="M18 24h28l-2.5 22a3 3 0 0 1-3 2.6H23.5a3 3 0 0 1-3-2.6L18 24z" fill="#fff" />
      <path
        d="M25 24v-3a7 7 0 0 1 14 0v3"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M24.5 42V31l7.5 8 7.5-8v11"
        fill="none"
        stroke="#c2410c"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
