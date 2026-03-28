import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ isOpen, onClose, title, children, footer }) {
  const [render, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
    else setTimeout(() => setRender(false), 300); // Wait for exit animation
  }, [isOpen]);

  if (!render) return null;

  return (
    <div className="slide-over-overlay" onClick={onClose} style={{ animation: isOpen ? 'fadeIn 200ms ease' : 'fadeOut 300ms ease' }}>
      <div 
        className="slide-over-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="slide-over-header">
          <h2 className="heading-2">{title}</h2>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>
        <div className="slide-over-body">
          {children}
        </div>
        {footer && (
          <div className="slide-over-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
