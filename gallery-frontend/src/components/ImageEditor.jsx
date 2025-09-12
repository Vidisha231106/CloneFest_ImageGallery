import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Download, Undo, Redo, Eye, EyeOff } from 'lucide-react';

// NOTE: The applyFilters function and filterPresets array are unchanged and remain the same.
// ... (Your existing applyFilters function and filterPresets array go here)

// Advanced filter functions
function applyFilters(ctx, settings) {
  const { brightness, contrast, saturation, hue, temperature, exposure, highlights, shadows, filter } = settings;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;

  const brightnessOffset = Math.floor((brightness / 100) * 255);
  const exposureMultiplier = Math.pow(2, exposure / 100);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * exposureMultiplier));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * exposureMultiplier));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * exposureMultiplier));
    
    data[i] = Math.min(255, Math.max(0, data[i] + brightnessOffset));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessOffset));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessOffset));
  }

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    data[i] = Math.min(255, Math.max(0, gray + saturation / 100 * (r - gray)));
    data[i + 1] = Math.min(255, Math.max(0, gray + saturation / 100 * (g - gray)));
    data[i + 2] = Math.min(255, Math.max(0, gray + saturation / 100 * (b - gray)));
  }

  const tempFactor = temperature / 100;
  for (let i = 0; i < data.length; i += 4) {
    if (tempFactor > 0) {
      data[i] = Math.min(255, data[i] + tempFactor * 20);
      data[i + 2] = Math.max(0, data[i + 2] - tempFactor * 10);
    } else {
      data[i] = Math.max(0, data[i] + tempFactor * 10);
      data[i + 2] = Math.min(255, data[i + 2] - tempFactor * 20);
    }
  }

  switch (filter) {
    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
        data[i] = Math.min(255, r * 0.9 + g * 0.3 + b * 0.2);
        data[i + 1] = Math.min(255, r * 0.2 + g * 0.8 + b * 0.1);
        data[i + 2] = Math.min(255, r * 0.1 + g * 0.2 + b * 0.6);
      }
      break;
    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
        data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
      }
      break;
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
      }
      break;
    case 'dramatic':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2);
        data[i + 1] = Math.min(255, data[i + 1] * 1.1);
        data[i + 2] = Math.min(255, data[i + 2] * 0.9);
      }
      break;
    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] * 0.8);
        data[i + 2] = Math.min(255, data[i + 2] * 1.3);
      }
      break;
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3);
        data[i + 1] = Math.min(255, data[i + 1] * 1.1);
        data[i + 2] = Math.max(0, data[i + 2] * 0.8);
      }
      break;
  }
  ctx.putImageData(imageData, 0, 0);
}

const filterPresets = [
  { label: 'None', value: 'none' },
  { label: 'Vintage', value: 'vintage' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'B&W', value: 'grayscale' },
  { label: 'Dramatic', value: 'dramatic' },
  { label: 'Cool', value: 'cool' },
  { label: 'Warm', value: 'warm' }
];


function ImageEditor({ originalImageUrl, onSave, onCancel, theme }) {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const canvasWrapRef = useRef(null);
  
  const [settings, setSettings] = useState({
    brightness: 0, contrast: 0, saturation: 100, hue: 0, temperature: 0,
    exposure: 0, highlights: 0, shadows: 0, filter: 'none'
  });
  
  const [showPreview, setShowPreview] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePercent, setComparePercent] = useState(50);
  const [zoom, setZoom] = useState(1);

  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // --- Core Drawing and Resizing Logic ---

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImageUrl;
    img.onload = () => {
      imgRef.current = img;
      requestAnimationFrame(() => {
        resizeCanvasesToFit();
        drawImage();
        saveStateToUndo();
      });
    };
  }, [originalImageUrl]);

  useEffect(() => {
    const onResize = () => {
      resizeCanvasesToFit();
      drawImage();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // CHANGED: This function is now the single source of truth for canvas dimensions.
  const resizeCanvasesToFit = () => {
    if (!canvasRef.current || !originalCanvasRef.current || !imgRef.current || !canvasWrapRef.current) return;

    const wrap = canvasWrapRef.current;
    const maxW = wrap.clientWidth;
    const maxH = wrap.clientHeight;
    
    if (maxW <= 0 || maxH <= 0) return;

    const img = imgRef.current;
    const factor = Math.min(maxW / img.width, maxH / img.height);
    const newW = Math.floor(img.width * factor);
    const newH = Math.floor(img.height * factor);

    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    canvas.width = newW;
    canvas.height = newH;
    originalCanvas.width = newW;
    originalCanvas.height = newH;

    const originalCtx = originalCanvas.getContext('2d');
    originalCtx.clearRect(0, 0, newW, newH);
    originalCtx.drawImage(img, 0, 0, newW, newH);
  };

  // CHANGED: This function NO LONGER resizes the canvas. It only handles drawing with transforms.
  const drawImage = () => {
    if (!canvasRef.current || !imgRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const { width, height } = canvas;
    
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    // Apply transformations in order
    ctx.translate(width / 2, height / 2); // 1. Move origin to center
    ctx.scale(zoom, zoom);                 // 2. Apply zoom
    ctx.rotate((rotation * Math.PI) / 180);// 3. Apply rotation
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1); // 4. Apply flips
    
    // 5. Draw the image centered on the transformed origin
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    
    ctx.restore(); // Restore context to remove transformations

    const hasFilters = Object.entries(settings).some(([key, value]) => {
      if (key === 'saturation') return value !== 100;
      if (key === 'filter') return value !== 'none';
      return value !== 0;
    });

    if (hasFilters) {
      applyFilters(ctx, settings);
    }
  };
  
  // NOTE: This effect now correctly redraws whenever a transform property changes.
  useEffect(() => {
    drawImage();
  }, [settings, rotation, flipHorizontal, flipVertical, zoom]);


  // --- State Management and UI Handlers (Unchanged) ---
  
  const saveStateToUndo = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    setUndoStack(prev => [...prev.slice(-9), dataUrl]);
    setRedoStack([]);
  };

  const handleSettingChange = (key, value) => {
    saveStateToUndo();
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // ... (Your existing handler functions: handleUndo, handleRedo, loadImageDataUrl, resetAll, handleRotate, handleFlip, handleDownload, handleSave, onCropMouseDown, onCropMouseMove, onCropMouseUp, applyCrop)
  // ... (Paste all your unchanged handler functions here to keep the component complete)
   const handleUndo = () => {
    if (undoStack.length === 0) return;
    const currentState = canvasRef.current.toDataURL();
    const lastState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [currentState, ...prev.slice(0, 9)]);
    setUndoStack(prev => prev.slice(0, -1));
    
    loadImageDataUrl(lastState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const currentState = canvasRef.current.toDataURL();
    const nextState = redoStack[0];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(1));
    
    loadImageDataUrl(nextState);
  };

  const loadImageDataUrl = (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = img.width;
      canvasRef.current.height = img.height;
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const resetAll = () => {
    saveStateToUndo();
    setSettings({
      brightness: 0, contrast: 0, saturation: 100, hue: 0, temperature: 0,
      exposure: 0, highlights: 0, shadows: 0, filter: 'none'
    });
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setCropRect(null);
    setCropMode(false);
    drawImage();
  };

  const handleRotate = (degrees) => {
    saveStateToUndo();
    setRotation(prev => (prev + degrees) % 360);
  };

  const handleFlip = (direction) => {
    saveStateToUndo();
    if (direction === 'horizontal') {
      setFlipHorizontal(prev => !prev);
    } else {
      setFlipVertical(prev => !prev);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onSave(blob, { ...settings, rotation, flipHorizontal, flipVertical });
      }
    }, 'image/png');
  };

  const onCropMouseDown = (e) => {
    if (!cropMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsCropping(true);
    setCropRect({ x, y, w: 0, h: 0 });
  };
  const onCropMouseMove = (e) => {
    if (!isCropping || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropRect((prev) => {
      if (!prev) return prev;
      return { x: prev.x, y: prev.y, w: Math.max(1, x - prev.x), h: Math.max(1, y - prev.y) };
    });
  };
  const onCropMouseUp = () => setIsCropping(false);

  const applyCrop = () => {
    if (!canvasRef.current || !cropRect) return;
    const { x, y, w, h } = cropRect;
    if (w < 5 || h < 5) { setCropMode(false); setCropRect(null); return; }

    const src = canvasRef.current;
    const off = document.createElement('canvas');
    off.width = Math.floor(w);
    off.height = Math.floor(h);
    const octx = off.getContext('2d');
    octx.drawImage(src, Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h), 0, 0, Math.floor(w), Math.floor(h));
    const url = off.toDataURL('image/png');

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
      setSettings({ brightness: 0, contrast: 0, saturation: 100, hue: 0, temperature: 0, exposure: 0, highlights: 0, shadows: 0, filter: 'none' });
      setCropRect(null);
      setCropMode(false);
      resizeCanvasesToFit();
      drawImage();
      saveStateToUndo();
    };
    img.src = url;
  };

  // --- JSX (Unchanged) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-80">
        <h2 className="text-white text-xl font-semibold">Image Editor</h2>
        <div className="flex items-center space-x-2">
           <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50" title="Undo"><Undo size={20} /></button>
           <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50" title="Redo"><Redo size={20} /></button>
           <button onClick={() => setShowPreview(!showPreview)} className="p-2 text-white hover:bg-white/20 rounded" title={showPreview ? "Hide Preview" : "Show Preview"}>{showPreview ? <EyeOff size={20} /> : <Eye size={20} />}</button>
           <button onClick={() => setCompareMode(prev => !prev)} className="p-2 text-white hover:bg-white/20 rounded" title={compareMode ? "Disable Compare" : "Enable Compare"}>A/B</button>
           {!cropMode ? <button onClick={() => { setCompareMode(false); setCropMode(true); }} className="px-3 py-2 text-white bg-gray-700 hover:bg-gray-600 rounded">Crop</button> : <div className="flex items-center space-x-2"><button onClick={applyCrop} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white">Apply</button><button onClick={() => setCropMode(false)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Cancel</button></div>}
           <button onClick={onCancel} className="p-2 text-white hover:bg-white/20 rounded"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 relative" ref={canvasWrapRef}>
           <div className="relative max-w-full max-h-full flex items-center justify-center">
            {!compareMode ? (
              <div className="relative inline-block">
                {showPreview ? (
                  <canvas ref={canvasRef} className="block max-w-full max-h-full rounded shadow-lg" />
                ) : (
                  <canvas ref={originalCanvasRef} className="block max-w-full max-h-full rounded shadow-lg" />
                )}
                {cropMode && showPreview && (
                  <div onMouseDown={onCropMouseDown} onMouseMove={onCropMouseMove} onMouseUp={onCropMouseUp} className="absolute inset-0 cursor-crosshair">
                    {cropRect && (
                      <div style={{ position: 'absolute', left: Math.min(cropRect.x, cropRect.x + cropRect.w), top: Math.min(cropRect.y, cropRect.y + cropRect.h), width: Math.abs(cropRect.w), height: Math.abs(cropRect.h), boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', outline: '2px solid #3b82f6' }} />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <canvas ref={originalCanvasRef} className="block max-w-full max-h-full rounded shadow-lg absolute inset-0" />
                <div style={{ position: 'relative' }}>
                  <canvas ref={canvasRef} className="block max-w-full max-h-full rounded shadow-lg" style={{ clipPath: `inset(0 ${100 - comparePercent}% 0 0)` }} />
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-80 flex items-center space-x-2">
                  <input type="range" min="0" max="100" value={comparePercent} onChange={(e) => setComparePercent(parseInt(e.target.value, 10))} className="w-full" />
                  <span className="text-white text-xs whitespace-nowrap">{comparePercent}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Controls Panel */}
        <div className="w-80 bg-gray-900 text-white overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Transform Controls */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Transform</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => handleRotate(-90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-2"><RotateCcw size={16} /><span>-90°</span></button>
                <button onClick={() => handleRotate(90)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-2"><RotateCw size={16} /><span>+90°</span></button>
                <button onClick={() => handleFlip('horizontal')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-2"><FlipHorizontal size={16} /><span>Flip H</span></button>
                <button onClick={() => handleFlip('vertical')} className="p-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-2"><FlipVertical size={16} /><span>Flip V</span></button>
              </div>
            </div>
            {/* Filter Presets */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Presets</h3>
              <select value={settings.filter} onChange={(e) => handleSettingChange('filter', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-2">
                {filterPresets.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
              </select>
            </div>
            {/* Adjustments */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Adjustments</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span>Brightness</span><span>{settings.brightness}</span></div>
                  <input type="range" min="-100" max="100" value={settings.brightness} onChange={(e)=>handleSettingChange('brightness', parseInt(e.target.value,10))} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span>Contrast</span><span>{settings.contrast}</span></div>
                  <input type="range" min="-100" max="100" value={settings.contrast} onChange={(e)=>handleSettingChange('contrast', parseInt(e.target.value,10))} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span>Saturation</span><span>{settings.saturation}</span></div>
                  <input type="range" min="0" max="200" value={settings.saturation} onChange={(e)=>handleSettingChange('saturation', parseInt(e.target.value,10))} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span>Temperature</span><span>{settings.temperature}</span></div>
                  <input type="range" min="-100" max="100" value={settings.temperature} onChange={(e)=>handleSettingChange('temperature', parseInt(e.target.value,10))} className="w-full" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span>Exposure</span><span>{settings.exposure}</span></div>
                  <input type="range" min="-100" max="100" value={settings.exposure} onChange={(e)=>handleSettingChange('exposure', parseInt(e.target.value,10))} className="w-full" />
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col space-y-4 pt-2 border-t border-gray-800">
               <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Zoom</span>
                <input type="range" min="0.25" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-40" />
                <span className="text-sm text-gray-400 w-12 text-right">{Math.round(zoom * 100)}%</span>
              </div>
               <div className="flex items-center justify-between">
                 <button onClick={resetAll} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded">Reset</button>
                 <div className="space-x-2">
                   <button onClick={handleDownload} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded inline-flex items-center"><Download size={16} className="mr-2"/>Download</button>
                   <button onClick={handleSave} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded">Save</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageEditor;