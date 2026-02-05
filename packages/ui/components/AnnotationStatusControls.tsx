import React from 'react';
import { AnnotationStatus } from '../types';

interface AnnotationStatusControlsProps {
  currentStatus?: AnnotationStatus;
  onStatusChange: (status: AnnotationStatus) => void;
  disabled?: boolean;
  size?: 'small' | 'large';
}

const statusOptions = [
  {
    status: AnnotationStatus.OPEN,
    label: 'Aberto',
    description: 'Anotação aberta e aguardando revisão',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    status: AnnotationStatus.IN_PROGRESS,
    label: 'Em Progresso',
    description: 'Trabalhando nesta anotação',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    status: AnnotationStatus.RESOLVED,
    label: 'Resolvido',
    description: 'Anotação resolvida e concluída',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const sizeClasses = {
  small: {
    container: 'flex-col gap-1',
    button: 'px-2 py-1.5',
    label: 'text-[10px]',
    icon: 'w-3.5 h-3.5',
  },
  large: {
    container: 'flex-row gap-2',
    button: 'px-3 py-2',
    label: 'text-xs',
    icon: 'w-4 h-4',
  },
};

export const AnnotationStatusControls: React.FC<AnnotationStatusControlsProps> = ({
  currentStatus = AnnotationStatus.OPEN,
  onStatusChange,
  disabled = false,
  size = 'small',
}) => {
  const handleStatusClick = (status: AnnotationStatus) => {
    if (disabled) return;

    // Optional confirmation for RESOLVED status
    if (status === AnnotationStatus.RESOLVED && currentStatus !== AnnotationStatus.RESOLVED) {
      const confirmed = window.confirm(
        'Marcar esta anotação como resolvida? Isso registrará quem e quando resolveu.'
      );
      if (!confirmed) return;
    }

    onStatusChange(status);
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex ${classes.container}`}>
      {statusOptions.map((option) => {
        const isActive = currentStatus === option.status;
        const activeClasses = isActive
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground';

        return (
          <button
            key={option.status}
            onClick={() => handleStatusClick(option.status)}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 rounded-md border transition-all
              ${classes.button} ${activeClasses}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={option.description}
          >
            <span className={classes.icon}>
              {option.icon}
            </span>
            <span className={`${classes.label} font-medium`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default AnnotationStatusControls;
