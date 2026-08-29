import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = (status || '').toUpperCase().trim();

  let badgeStyle = 'bg-gray-100 text-textSecondary border-gray-200 dark:bg-neutral/15 dark:text-textSecondary dark:border-borderDefault';
  let Icon = FileText;

  if (['MATCH', 'VERIFIED', 'COMPLETED', 'APPROVED', 'ACTIVE', 'SUCCESS', 'COMPLETE'].includes(norm)) {
    badgeStyle = 'bg-[#EAF8ED] text-[#2E954A] border-[#BDE8C7] dark:bg-success/15 dark:text-success dark:border-success/30';
    Icon = CheckCircle2;
  } else if (['PROCESSING', 'PENDING', 'QUEUED', 'DRAFT', 'UNDER_REVIEW'].includes(norm)) {
    badgeStyle = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-info/15 dark:text-info dark:border-info/30';
    Icon = Clock;
  } else if (['PENDING_REVIEW', 'LOW_CONFIDENCE', 'WARNING', 'PENDING REVIEW'].includes(norm)) {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-warning/15 dark:text-warning dark:border-warning/30';
    Icon = AlertTriangle;
  } else if (['MISMATCH', 'FAILED', 'DENIED', 'REVOKED', 'FAILURE'].includes(norm)) {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-error/15 dark:text-error dark:border-error/30';
    Icon = XCircle;
  } else if (['SUPERSEDED', 'ARCHIVED', 'NOT_APPLICABLE'].includes(norm)) {
    badgeStyle = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-neutral/15 dark:text-textSecondary dark:border-borderDefault';
    Icon = ShieldCheck;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${badgeStyle} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
