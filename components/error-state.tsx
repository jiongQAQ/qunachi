'use client';

import React from 'react';

interface ErrorStateProps {
  title: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, error, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-icon">
        <ErrorIcon />
      </div>
      <h3 className="error-title">{title}</h3>
      {description && <p className="error-description">{description}</p>}
      {error && <p className="error-suggestion">{error}</p>}
      {onRetry && (
        <div className="error-actions">
          <button className="btn-primary" onClick={onRetry}>
            重试
          </button>
        </div>
      )}

      <style jsx>{`
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .error-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 20px;
          color: #EF4444;
        }

        .error-title {
          font-size: 17px;
          font-weight: 600;
          color: #1C1917;
          margin: 0 0 8px 0;
        }

        .error-description {
          font-size: 14px;
          color: #57534E;
          margin: 0 0 8px 0;
          max-width: 300px;
          line-height: 1.5;
        }

        .error-suggestion {
          font-size: 13px;
          color: #A8A29E;
          margin: 0 0 20px 0;
          max-width: 300px;
          line-height: 1.5;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-primary {
          background-color: #F97316;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          padding: 10px 20px;
          min-height: 44px;
          cursor: pointer;
          transition: background-color 150ms ease-out, transform 100ms ease-out;
        }

        .btn-primary:hover {
          background-color: #EA580C;
        }

        .btn-primary:active {
          background-color: #C2410C;
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3" />
      <path d="M32 20V36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="44" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default ErrorState;
