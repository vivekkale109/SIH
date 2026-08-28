import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = status.toUpperCase().trim();

  let bgClass = 'bg-neutral/20 text-textSecondary border-neutral/30';
  let Icon = FileText;

  if (['MATCH', 'VERIFIED', 'COMPLETED', 'APPROVED', 'ACTIVE', 'SUCCESS'].includes(norm)) {
    bgClass = 'bg-success/15 text-success border-success/30';
    Icon = CheckCircle2;
  } else if (['PROCESSING', 'PENDING', 'QUEUED', 'DRAFT', 'UNDER_REVIEW'].includes(norm)) {
    bgClass = 'bg-info/15 text-info border-info/30';
    Icon = Clock;
  } else if (['LOW_CONFIDENCE', 'WARNING'].includes(norm)) {
    bgClass = 'bg-warning/15 text-warning border-warning/30';
    Icon = AlertTriangle;
  } else if (['MISMATCH', 'FAILED', 'DENIED', 'REVOKED', 'FAILURE'].includes(norm)) {
    bgClass = 'bg-error/15 text-error border-error/30';
    Icon = XCircle;
  } else if (['SUPERSEDED', 'ARCHIVED', 'NOT_APPLICABLE'].includes(norm)) {
    bgClass = 'bg-neutral/15 text-textSecondary border-borderDefault';
    Icon = ShieldCheck;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium border ${bgClass} ${className}`}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {status.replace(/_/g, ' ')}
    </span>
  );
};
