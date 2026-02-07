/**
 * Cursor Component
 *
 * Renders a single user's cursor with name tooltip.
 * Per CONTEXT.md: "Visual do cursor: Cursor + highlight (fundo colorido no texto selecionado)"
 * Per CONTEXT.md: "Nome associado: Tooltip flutuante acima do cursor"
 */

import { memo } from "react";

export interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
  isTyping?: boolean;
  selection?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

export const Cursor = memo(({ x, y, color, name, isTyping, selection }: CursorProps) => {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="transition-transform duration-75 ease-out"
      style={{ pointerEvents: "none" }}
    >
      {/* Cursor pointer */}
      <path
        d="M0 0 L12 12 L7 12 L4 16 Z"
        fill={color}
        strokeWidth={1}
        stroke="white"
      />

      {/* Name label/tooltip */}
      <foreignObject x={12} y={0} width={200} height={24} style={{ pointerEvents: "none" }}>
        <div
          className="px-2 py-0.5 text-xs font-medium text-white whitespace-nowrap rounded shadow-sm"
          style={{ backgroundColor: color }}
        >
          {name}
        </div>
      </foreignObject>

      {/* Selection highlight */}
      {selection && (
        <rect
          x={Math.min(selection.start.x, selection.end.x)}
          y={Math.min(selection.start.y, selection.end.y)}
          width={Math.abs(selection.end.x - selection.start.x)}
          height={Math.abs(selection.end.y - selection.start.y)}
          fill={color}
          fillOpacity={0.3}
        />
      )}
    </g>
  );
});

Cursor.displayName = "Cursor";
