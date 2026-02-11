/**
 * Componente de anotação de imagem
 * Permite desenhar sobre imagens com caneta, seta e círculo
 * Baseado em: https://github.com/backnotprop/plannotator
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, ArrowRight, Circle } from 'lucide-react';

const TOOL_ICONS: Record<DrawingTool, React.ComponentType<{ className?: string }>> = {
  pen: Pencil,
  arrow: ArrowRight,
  circle: Circle,
};
import type { DrawingState, DrawingTool, Point, Stroke } from '../types/drawing';
import { DEFAULT_DRAWING_STATE, DRAWING_COLORS, DRAWING_SIZES, TOOL_CONFIG, DRAWING_KEYBINDINGS } from '../types/drawing';
import {
  renderAllStrokes,
  renderStroke,
  getCanvasPoint,
  exportCanvasAsPNG,
  combineImageAndDrawing,
} from '../utils/drawing';

interface ImageAnnotatorProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  onAnnotationsChange?: (strokes: Stroke[]) => void;
  initialStrokes?: Stroke[];
}

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  src,
  alt = '',
  className = '',
  onAnnotationsChange,
  initialStrokes = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [drawing, setDrawing] = useState<DrawingState>({
    ...DEFAULT_DRAWING_STATE,
    strokes: initialStrokes,
  });
  // Usar ref para isDrawing evita stale closure nos event handlers
  const isDrawingRef = useRef(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Ref sincronizado com drawing para uso nos handlers sem re-criar callbacks
  const drawingRef = useRef(drawing);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);

  // Carregar imagem e configurar canvas
  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const handleImageLoad = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setImageLoaded(true);
    };

    if (img.complete && img.naturalWidth > 0) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
    }

    return () => {
      img.removeEventListener('load', handleImageLoad);
    };
  }, [src]);

  // Renderiza traços quando mudam
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderAllStrokes(ctx, drawing.strokes);
  }, [drawing.strokes, imageLoaded]);

  // Atalhos de teclado para ferramentas de desenho
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tool = DRAWING_KEYBINDINGS[e.key];
      if (tool) {
        e.preventDefault();
        setDrawing(prev => ({ ...prev, tool }));
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setDrawing(prev => {
          const newStrokes = prev.strokes.slice(0, -1);
          onAnnotationsChange?.(newStrokes);
          return { ...prev, strokes: newStrokes };
        });
      }
      if (e.key === 'x' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setDrawing(prev => {
          onAnnotationsChange?.([]);
          return { ...prev, strokes: [] };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnnotationsChange]);

  // Ref para o stroke em andamento (evita re-renders durante o desenho)
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Renderiza o estado atual do canvas diretamente via refs
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderAllStrokes(ctx, drawingRef.current.strokes);
    if (currentStrokeRef.current) {
      renderStroke(ctx, currentStrokeRef.current);
    }
  }, []);

  // Handler para início do desenho
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const point = getCanvasPoint(e, canvas);
    const current = drawingRef.current;

    const stroke: Stroke = {
      id: crypto.randomUUID(),
      tool: current.tool,
      points: [point],
      color: current.color,
      size: current.strokeSize,
    };

    currentStrokeRef.current = stroke;
    renderCanvas();
  }, [renderCanvas]);

  // Handler para movimento durante o desenho
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPoint(e, canvas);
    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, point],
    };

    renderCanvas();
  }, [renderCanvas]);

  // Handler para finalizar o desenho
  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;

    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    setDrawing(prev => {
      const newStrokes = [...prev.strokes, finishedStroke];
      onAnnotationsChange?.(newStrokes);
      return { ...prev, strokes: newStrokes };
    });
  }, [onAnnotationsChange]);

  const setTool = (tool: DrawingTool) => {
    setDrawing(prev => ({ ...prev, tool }));
  };

  const setColor = (color: string) => {
    setDrawing(prev => ({ ...prev, color }));
  };

  const setSize = (size: number) => {
    setDrawing(prev => ({ ...prev, strokeSize: size }));
  };

  const undo = () => {
    setDrawing(prev => {
      const newStrokes = prev.strokes.slice(0, -1);
      onAnnotationsChange?.(newStrokes);
      return { ...prev, strokes: newStrokes };
    });
  };

  const clear = () => {
    setDrawing(prev => {
      onAnnotationsChange?.([]);
      return { ...prev, strokes: [] };
    });
  };

  // Exporta a imagem combinada (imagem base + traços)
  const exportPNG = () => {
    combineImageAndDrawing(src, drawing.strokes).then(dataUrl => {
      const link = document.createElement('a');
      link.download = `annotated-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }).catch(() => {
      // Fallback: exporta só os traços se a imagem não puder ser carregada (CORS)
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = exportCanvasAsPNG(canvas);
      const link = document.createElement('a');
      link.download = `annotated-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Toolbar de desenho */}
      <DrawingToolbar
        currentTool={drawing.tool}
        currentColor={drawing.color}
        currentSize={drawing.strokeSize}
        strokeCount={drawing.strokes.length}
        onToolChange={setTool}
        onColorChange={setColor}
        onSizeChange={setSize}
        onUndo={undo}
        onClear={clear}
        onExport={exportPNG}
      />

      {/* Container da imagem */}
      <div className="relative group">
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="max-w-full h-auto"
        />

        {/* Canvas overlay */}
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute top-0 left-0 w-full h-full touch-none"
            style={{ cursor: TOOL_CONFIG[drawing.tool].cursor }}
          />
        )}

        {/* Hover hint — shown only when no strokes exist */}
        {drawing.strokes.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-background/80 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-xs text-muted-foreground flex items-center gap-1.5">
              <Pencil className="w-3 h-3" />
              Clique para anotar
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Toolbar de ferramentas de desenho
 */
interface DrawingToolbarProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentSize: number;
  strokeCount: number;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  currentColor,
  currentSize,
  strokeCount,
  onToolChange,
  onColorChange,
  onSizeChange,
  onUndo,
  onClear,
  onExport,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className="absolute top-2 left-2 z-10"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Trigger - ícone único sempre visível */}
      <div className={`flex items-center gap-2 bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg transition-all duration-200 ${expanded ? 'p-2 flex-wrap' : 'p-1.5'}`}>
        <button
          onClick={() => onToolChange(currentTool)}
          className="p-1.5 rounded-md bg-primary text-primary-foreground"
          title={`${TOOL_CONFIG[currentTool].label} — passe o mouse para mais opções`}
        >
          {React.createElement(TOOL_ICONS[currentTool], { className: 'w-4 h-4' })}
        </button>

        {expanded && (
          <>
            {/* Ferramentas */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              {(['pen', 'arrow', 'circle'] as DrawingTool[]).map(tool => (
                tool !== currentTool && (
                  <button
                    key={tool}
                    onClick={() => onToolChange(tool)}
                    className="p-1.5 rounded-md transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
                    title={`${TOOL_CONFIG[tool].label} (${Object.keys(DRAWING_KEYBINDINGS).find(k => DRAWING_KEYBINDINGS[k] === tool)})`}
                  >
                    {React.createElement(TOOL_ICONS[tool], { className: 'w-4 h-4' })}
                  </button>
                )
              ))}
            </div>

            {/* Cores */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              {DRAWING_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-5 h-5 rounded-full transition-all ${
                    currentColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Tamanho */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              {DRAWING_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => onSizeChange(size)}
                  className={`p-1 rounded-md transition-all ${
                    currentSize === size
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  title={`Tamanho ${size}px`}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: size, height: size }}
                  />
                </button>
              ))}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={strokeCount === 0}
                className="p-1.5 rounded-md transition-all hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                title="Desfazer (Ctrl+Z)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>

              <button
                onClick={onClear}
                disabled={strokeCount === 0}
                className="p-1.5 rounded-md transition-all hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                title="Limpar tudo (Ctrl+Shift+X)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <button
                onClick={onExport}
                disabled={strokeCount === 0}
                className="p-1.5 rounded-md transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar como PNG"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Badge de contagem de traços */}
      {strokeCount > 0 && !expanded && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
          {strokeCount}
        </span>
      )}
    </div>
  );
};
