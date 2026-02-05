import React, { useState } from 'react';
import { Annotation, AnnotationType } from '../types';
import { annotationTypeConfig } from '../utils/annotationTypeConfig';

export interface AnnotationMarkerProps {
  annotation: Annotation;
  position: { top: number; left: number };
  isSelected?: boolean;
  onClick: (annotationId: string) => void;
  style?: 'underline' | 'highlight' | 'icon' | 'badge';
}

/**
 * AnnotationMarker - Visual marker component for annotations
 *
 * Renders visual indicators for annotated elements with support for:
 * - Different marker styles per annotation type
 * - Click to select annotation
 * - Hover states
 * - Dynamic positioning
 */
export const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  position,
  isSelected = false,
  onClick,
  style = 'badge'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = annotationTypeConfig[annotation.type];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(annotation.id);
  };

  const baseClasses = `
    absolute z-50 cursor-pointer transition-all duration-200
    ${isHovered ? 'scale-110' : 'scale-100'}
    ${isSelected ? 'ring-2 ring-offset-1' : ''}
  `;

  // Render different marker styles based on annotation type and style prop
  const renderMarker = () => {
    switch (style) {
      case 'underline':
        return (
          <div
            className={baseClasses}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              borderBottom: `2px solid currentColor`,
              width: '100%',
              height: '2px'
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={`${config.label}: ${annotation.originalText}`}
          />
        );

      case 'highlight':
        return (
          <div
            className={`${baseClasses} ${config.bg} opacity-30 hover:opacity-50`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
            aria-hidden="true"
          />
        );

      case 'icon':
        return (
          <button
            className={`
              ${baseClasses} ${config.color} ${config.bg}
              p-1 rounded-full shadow-sm
              hover:shadow-md
              ${isSelected ? `ring-${config.color.split('-')[1]}-500` : ''}
            `}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transformOrigin: 'top left',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`${config.label} annotation`}
            title={`${config.label}: ${annotation.originalText}`}
          >
            <span className="block w-3 h-3">
              {config.icon}
            </span>
          </button>
        );

      case 'badge':
      default:
        return (
          <div
            className={`
              ${baseClasses}
              flex items-center gap-1 px-1.5 py-0.5 rounded
              ${config.bg} ${config.color}
              text-[10px] font-medium shadow-sm
              hover:shadow-md
              ${isSelected ? 'ring-2 ring-current' : ''}
            `}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transformOrigin: 'top left',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={`${config.label}: ${annotation.originalText}`}
          >
            <span className="flex-shrink-0 w-3 h-3">
              {config.icon}
            </span>
            <span className="uppercase tracking-wider">
              {config.label}
            </span>
          </div>
        );
    }
  };

  return renderMarker();
};

/**
 * Hook to determine the appropriate marker style for an annotation type
 */
export function getMarkerStyleForType(type: AnnotationType): 'underline' | 'highlight' | 'icon' | 'badge' {
  switch (type) {
    case AnnotationType.DELETION:
      return 'icon'; // Show trash icon
    case AnnotationType.INSERTION:
      return 'icon'; // Show plus icon
    case AnnotationType.REPLACEMENT:
      return 'badge'; // Show badge with label
    case AnnotationType.COMMENT:
      return 'badge'; // Show badge with label
    case AnnotationType.GLOBAL_COMMENT:
      return 'badge'; // Show badge with label
    default:
      return 'badge';
  }
}
