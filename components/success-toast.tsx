'use client';

import React, { useEffect, useState } from 'react';

interface SuccessToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function SuccessToast({ message, visible, onClose, duration = 3000 }: SuccessToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setIsExiting(false);

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShouldRender(false);
      setIsExiting(false);
      onClose();
    }, 200);
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`toast-container ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon">
        <CheckIcon />
      </div>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose} aria-label="关闭">
        <CloseIcon />
      </button>

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background-color: #16A34A;
          color: white;
          border-radius: 9999px;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05);
          font-size: 14px;
          font-weight: 500;
          z-index: 200;
        }

        .toast-enter {
          animation: slideDown 250ms ease-out;
        }

        .toast-exit {
          animation: slideUp 200ms ease-in forwards;
        }

        .toast-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          white-space: nowrap;
        }

        .toast-close {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: white;
          opacity: 0.8;
          border-radius: 50%;
          transition: opacity 150ms ease-out, background-color 150ms ease-out;
          padding: 0;
          margin-left: 4px;
        }

        .toast-close:hover {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.15);
        }

        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 10L8 14L16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 1L13 13M1 13L13 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default SuccessToast;
