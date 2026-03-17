import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Undo, Check, X, Clipboard, Type } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ScreenshotEditor({ open, onOpenChange, imageUrl, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('draw');
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [fontSize, setFontSize] = useState(20);
  const [textInputActive, setTextInputActive] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [textBoxSize, setTextBoxSize] = useState({ width: 200, height: 100 });
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textInputRef = useRef(null);

  useEffect(() => {
    if (open && imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        saveToHistory();
      };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyStep - 1];
      setHistoryStep(historyStep - 1);
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleTextBoxMouseDown = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (e.target.classList.contains('text-box-header')) {
      setIsDraggingText(true);
      setDragStart({ 
        x: e.clientX - rect.left - textInputPosition.x, 
        y: e.clientY - rect.top - textInputPosition.y 
      });
    }
  };

  useEffect(() => {
    if (!isDraggingText && !isResizing) return;

    const handleMouseMove = (e) => {
      if (isDraggingText) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const newX = Math.max(0, Math.min(e.clientX - rect.left - dragStart.x, rect.width - textBoxSize.width));
        const newY = Math.max(0, Math.min(e.clientY - rect.top - dragStart.y, rect.height - textBoxSize.height));
        setTextInputPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setTextBoxSize({
          width: Math.max(100, textBoxSize.width + deltaX),
          height: Math.max(50, textBoxSize.height + deltaY)
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingText(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingText, isResizing, dragStart, textBoxSize]);

  const startDrawing = (e) => {
    if (tool === 'text') {
      if (textInputActive) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      setTextInputPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTextInputValue('');
      setTextBoxSize({ width: 200, height: 100 });
      setTextInputActive(true);
      
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 0);
      return;
    }

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'draw') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = lineWidth * 3;
      ctx.globalCompositeOperation = 'destination-out';
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const finishTextInput = () => {
    if (!textInputValue.trim()) {
      setTextInputActive(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = textInputPosition.x * scaleX;
    const y = (textInputPosition.y + 20) * scaleY;
    
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    
    const lines = textInputValue.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + (index * fontSize * 1.2));
    });
    
    setTextInputActive(false);
    setTextInputValue('');
    saveToHistory();
  };

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const img = new Image();
            const url = URL.createObjectURL(blob);
            img.onload = () => {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              saveToHistory();
            };
            img.src = url;
            return;
          }
        }
      }
    } catch (error) {
      console.error('클립보드 접근 실패:', error);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onSave(blob);
      onOpenChange(false);
    }, 'image/png');
  };

  const colors = [
    { value: '#ef4444', label: '빨강' },
    { value: '#f97316', label: '주황' },
    { value: '#eab308', label: '노랑' },
    { value: '#22c55e', label: '초록' },
    { value: '#3b82f6', label: '파랑' },
    { value: '#8b5cf6', label: '보라' },
    { value: '#000000', label: '검정' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>화면 캡처 편집</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('draw')}
              className="rounded-lg"
            >
              <Pencil className="w-4 h-4 mr-2" />
              그리기
            </Button>
            <Button
              variant={tool === 'erase' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('erase')}
              className="rounded-lg"
            >
              <Eraser className="w-4 h-4 mr-2" />
              지우기
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
              className="rounded-lg"
            >
              <Type className="w-4 h-4 mr-2" />
              텍스트
            </Button>
            
            <div className="w-px h-6 bg-slate-300 mx-2" />
            
            <div className="flex items-center gap-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c.value ? "border-slate-900 scale-110" : "border-slate-200"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
            
            <div className="w-px h-6 bg-slate-300 mx-2" />
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {tool === 'text' ? '크기:' : '굵기:'}
              </span>
              <input
                type="range"
                min={tool === 'text' ? '12' : '1'}
                max={tool === 'text' ? '72' : '10'}
                value={tool === 'text' ? fontSize : lineWidth}
                onChange={(e) => tool === 'text' ? setFontSize(Number(e.target.value)) : setLineWidth(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-slate-600 w-8">
                {tool === 'text' ? fontSize : lineWidth}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePaste}
              className="rounded-lg"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              붙여넣기 (Ctrl+V)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyStep <= 0}
              className="rounded-lg"
            >
              <Undo className="w-4 h-4 mr-2" />
              실행취소 (Ctrl+Z)
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="flex-1 overflow-auto bg-slate-100 rounded-lg flex items-center justify-center relative"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={cn(
              "max-w-full max-h-full bg-white shadow-lg",
              tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
            )}
          />
          {textInputActive && (
            <div
              className="absolute border-2 border-blue-500 bg-white flex flex-col"
              style={{
                left: `${textInputPosition.x}px`,
                top: `${textInputPosition.y}px`,
                width: `${textBoxSize.width}px`,
                height: `${textBoxSize.height}px`,
              }}
              onMouseDown={handleTextBoxMouseDown}
            >
              <div className="text-box-header bg-blue-500 text-white text-xs px-2 py-1 cursor-move select-none">
                텍스트 입력 (Enter: 줄바꿈, Esc: 취소, 외부 클릭: 확정)
              </div>
              <textarea
                ref={textInputRef}
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onBlur={finishTextInput}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setTextInputActive(false);
                    setTextInputValue('');
                  }
                }}
                className="flex-1 px-2 py-1 outline-none resize-none"
                style={{
                  fontSize: `${fontSize}px`,
                  color: color,
                  fontWeight: 'bold',
                  fontFamily: 'sans-serif'
                }}
              />
              <div 
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                style={{ 
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' 
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            <Check className="w-4 h-4 mr-2" />
            저장 및 첨부
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}