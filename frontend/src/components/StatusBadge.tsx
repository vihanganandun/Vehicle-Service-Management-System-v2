import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'appointment' | 'service' | 'payment' | 'role';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'service' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = status.toUpperCase();

  switch (s) {
    // Appointment Statuses
    case 'PENDING':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'CONFIRMED':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'IN_PROGRESS':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      break;
    case 'COMPLETED':
    case 'PAID':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'CANCELLED':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;

    // Roles
    case 'ADMIN':
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      break;
    case 'STAFF':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200 font-semibold';
      break;

    default:
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  const formatText = (str: string) => {
    return str.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {formatText(status)}
    </span>
  );
};
