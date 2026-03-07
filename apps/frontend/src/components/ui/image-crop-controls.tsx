import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Grid3x3, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ImageCropControlsProps {
  zoom: number;
  rotation: number;
  showGrid: boolean;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onToggleGrid: () => void;
  onReset: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export function ImageCropControls({
  zoom,
  rotation,
  showGrid,
  onZoomChange,
  onRotationChange,
  onToggleGrid,
  onReset,
  minZoom = 1,
  maxZoom = 3,
}: ImageCropControlsProps) {
  const handleRotateLeft = () => {
    onRotationChange((rotation - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    onRotationChange((rotation + 90) % 360);
  };

  return (
    <div className="space-y-3 border-4 border-border bg-background p-3">
      {/* Zoom Control */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            onZoomChange(Math.max(minZoom, zoom - 0.1));
          }}
          disabled={zoom <= minZoom}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={0.1}
          value={zoom}
          onChange={(e) => {
            onZoomChange(parseFloat(e.target.value));
          }}
          className="flex-1 cursor-pointer accent-foreground"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            onZoomChange(Math.min(maxZoom, zoom + 0.1));
          }}
          disabled={zoom >= maxZoom}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-sm font-mono text-foreground w-12 text-right shrink-0">
          {zoom.toFixed(1)}x
        </span>
      </div>

      {/* Rotation & Display Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleRotateLeft}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleRotateRight}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
          onClick={onToggleGrid}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {rotation !== 0 && (
        <div className="text-xs text-center font-mono text-muted-foreground">{rotation}°</div>
      )}
    </div>
  );
}
