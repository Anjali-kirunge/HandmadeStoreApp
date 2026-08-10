export default function Loading({ text = 'Loading…' }) {
  return (
    <div className="loading-block">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
