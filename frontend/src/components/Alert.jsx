import { useEffect, useState } from 'react';
import './Alert.css';

export default function Alert({ message, type = 'success', onClose, duration = 4000 }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`alert alert--${type} ${exiting ? 'alert--exit' : ''}`}>
      <span className="alert__icon">{icons[type]}</span>
      <span className="alert__message">{message}</span>
      <button className="alert__close" onClick={() => { setExiting(true); setTimeout(onClose, 300); }}>
        ✕
      </button>
    </div>
  );
}

/* Container for stacking alerts */
export function AlertContainer({ alerts, removeAlert }) {
  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
}
