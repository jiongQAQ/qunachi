'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: 'search' | 'location' | 'restaurant';
}

export function EmptyState({ title, description, action, icon = 'search' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <EmptyStateIcon type={icon} />
      </div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {action && (
        <button className="btn-primary empty-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
          color: #A8A29E;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 600;
          color: #1C1917;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #57534E;
          margin: 0 0 20px 0;
          max-width: 280px;
          line-height: 1.5;
        }

        .empty-action {
          margin-top: 4px;
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

function EmptyStateIcon({ type }: { type: 'search' | 'location' | 'restaurant' }) {
  if (type === 'search') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="35" cy="35" r="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 50L62 62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M28 35H42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'location') {
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 15C31.716 15 25 21.716 25 30C25 42.5 40 55 40 55C40 55 55 42.5 55 30C55 21.716 48.284 15 40 15Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="30" r="6" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }

  // restaurant icon
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 30V25C25 22.239 27.239 20 30 20H50C52.761 20 55 22.239 55 25V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 30H60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 30V50C30 52.209 31.791 54 34 54H46C48.209 54 50 52.209 50 50V30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 54V60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 54V60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M25 30C25 30 28 35 40 35C52 35 55 30 55 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default EmptyState;
