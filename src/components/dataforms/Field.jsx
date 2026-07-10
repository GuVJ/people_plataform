import './dataforms.css';

export default function Field({ label, required, children, hint }) {
  return (
    <label className="dform-field">
      <span className="dform-label">{label}{required && <span className="dform-required"> *</span>}</span>
      {children}
      {hint && <span className="dform-hint">{hint}</span>}
    </label>
  );
}
