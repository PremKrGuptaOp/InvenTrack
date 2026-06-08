import './ConfirmDialog.css';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, danger = true }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay animate-fade-in" onClick={onCancel}>
      <div className="confirm-dialog animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          {danger ? '⚠' : 'ℹ'}
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
