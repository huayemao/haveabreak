'use client';

import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { useMaojiStore } from '@/apps/maoji/store';
import { getEpdSpec } from '@/apps/maoji/epdSpecs';
import { DesignElement, TextElement, TodoElement, QrCodeElement, CalendarElement, ClockElement, ImageElement } from '@/apps/maoji/types';
import { Trash2, Move, Image as ImageIcon, X } from 'lucide-react';

const CanvasEditor = forwardRef<HTMLCanvasElement>((_props, ref) => {
  const { currentDesign, selectedElementId, selectElement, removeElement, updateElement } = useMaojiStore();
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const spec = currentDesign ? getEpdSpec(currentDesign.epdInch) : null;

  // Draw preview on the internal canvas
  useEffect(() => {
    if (!currentDesign || !spec || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to EPD dimensions
    canvas.width = spec.width;
    canvas.height = spec.height;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern for e-ink feel
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw elements
    currentDesign.elements.forEach(el => {
      drawElement(ctx, el);
    });

  }, [currentDesign, spec]);

  const drawElement = (ctx: CanvasRenderingContext2D, el: DesignElement) => {
    switch (el.type) {
      case 'text': {
        const textEl = el as TextElement;
        const font = textEl.fontFamily === 'wenkai' ? 'sans-serif' : textEl.fontFamily === 'serif' ? 'serif' : 'sans-serif';
        const weight = textEl.fontWeight === 'bold' ? 'bold ' : '';
        ctx.font = `${weight}${textEl.fontSize}px ${font}`;
        ctx.fillStyle = textEl.color === 'black' ? '#000000' : textEl.color === 'red' ? '#CC0000' : '#FFFFFF';
        ctx.textAlign = textEl.align;
        ctx.textBaseline = 'top';

        let xPos = el.x;
        if (textEl.align === 'center') xPos = el.x + el.width / 2;
        else if (textEl.align === 'right') xPos = el.x + el.width;

        // Handle multi-line text
        const lines = textEl.content.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, xPos, el.y + i * textEl.fontSize * 1.2);
        });
        break;
      }
      case 'todo': {
        const todoEl = el as TodoElement;
        ctx.font = `${todoEl.fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        todoEl.items.forEach((item, i) => {
          const y = el.y + i * (todoEl.fontSize * 1.5);
          // Checkbox
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(el.x, y, todoEl.fontSize * 0.8, todoEl.fontSize * 0.8);

          if (item.done) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(el.x + 2, y + 2, todoEl.fontSize * 0.8 - 4, todoEl.fontSize * 0.8 - 4);
            // Checkmark
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(el.x + 4, y + todoEl.fontSize * 0.4);
            ctx.lineTo(el.x + todoEl.fontSize * 0.3, y + todoEl.fontSize * 0.65);
            ctx.lineTo(el.x + todoEl.fontSize * 0.7, y + todoEl.fontSize * 0.2);
            ctx.stroke();
          }

          // Text
          ctx.fillStyle = item.done ? '#888888' : '#000000';
          if (item.done) {
            // Strikethrough
            const textWidth = ctx.measureText(item.text).width;
            ctx.fillText(item.text, el.x + todoEl.fontSize, y);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(el.x + todoEl.fontSize, y + todoEl.fontSize * 0.5);
            ctx.lineTo(el.x + todoEl.fontSize + textWidth, y + todoEl.fontSize * 0.5);
            ctx.stroke();
          } else {
            ctx.fillText(item.text, el.x + todoEl.fontSize, y);
          }
        });
        break;
      }
      case 'qrcode': {
        const qrEl = el as QrCodeElement;
        // Draw placeholder QR code pattern
        const size = Math.min(el.width, el.height);
        const cellSize = Math.max(4, Math.floor(size / 21));
        const offsetX = el.x + (el.width - cellSize * 21) / 2;
        const offsetY = el.y + (el.height - cellSize * 21) / 2;

        ctx.fillStyle = '#000000';
        // Draw simplified QR pattern (finder patterns + random data)
        // Top-left finder
        drawFinderPattern(ctx, offsetX, offsetY, cellSize);
        // Top-right finder
        drawFinderPattern(ctx, offsetX + (21 - 7) * cellSize, offsetY, cellSize);
        // Bottom-left finder
        drawFinderPattern(ctx, offsetX, offsetY + (21 - 7) * cellSize, cellSize);

        // Fill some data cells
        for (let row = 0; row < 21; row++) {
          for (let col = 0; col < 21; col++) {
            if (isFinderArea(row, col)) continue;
            if (Math.random() > 0.5) {
              ctx.fillRect(offsetX + col * cellSize, offsetY + row * cellSize, cellSize, cellSize);
            }
          }
        }
        break;
      }
      case 'calendar': {
        const calEl = el as CalendarElement;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[now.getDay()];

        // Title
        ctx.font = `bold ${el.height * 0.12}px sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${year}年${month}月`, el.x + el.width / 2, el.y + el.height * 0.05);

        // Day number
        ctx.font = `bold ${el.height * 0.35}px sans-serif`;
        ctx.fillText(`${day}`, el.x + el.width / 2, el.y + el.height * 0.2);

        // Weekday
        ctx.font = `${el.height * 0.1}px sans-serif`;
        ctx.fillText(`星期${weekday}`, el.x + el.width / 2, el.y + el.height * 0.58);

        // Calendar grid
        const firstDay = new Date(year, now.getMonth(), 1).getDay();
        const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
        const gridY = el.y + el.height * 0.7;
        const cellW = el.width / 7;
        const cellH = (el.y + el.height - gridY) / 6;

        ctx.font = `${Math.max(8, cellH * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Weekday headers
        weekdays.forEach((wd, i) => {
          ctx.fillStyle = '#666666';
          ctx.fillText(wd, el.x + cellW * (i + 0.5), gridY + cellH * 0.5);
        });

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
          const col = (firstDay + d - 1) % 7;
          const row = Math.floor((firstDay + d - 1) / 7);
          const cx = el.x + cellW * (col + 0.5);
          const cy = gridY + cellH * (row + 1.5);

          if (d === day) {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(cx, cy, cellW * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${d}`, cx, cy);
          } else {
            ctx.fillStyle = '#000000';
            ctx.fillText(`${d}`, cx, cy);
          }
        }
        break;
      }
      case 'clock': {
        const clockEl = el as ClockElement;
        const now = new Date();
        const hours = clockEl.format === '24h' ? now.getHours() : now.getHours() % 12 || 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        ctx.font = `bold ${el.height * 0.5}px sans-serif`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
          el.x + el.width / 2,
          el.y + el.height * 0.4
        );

        ctx.font = `${el.height * 0.15}px sans-serif`;
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `${String(seconds).padStart(2, '0')} ${clockEl.format === '24h' ? '' : (now.getHours() >= 12 ? 'PM' : 'AM')}`,
          el.x + el.width / 2,
          el.y + el.height * 0.75
        );
        break;
      }
      case 'image': {
        const imgEl = el as ImageElement;
        if (imgEl.src) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
          };
          img.src = imgEl.src;
        } else {
          // Placeholder
          ctx.strokeStyle = '#CCCCCC';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          ctx.setLineDash([]);

          ctx.fillStyle = '#AAAAAA';
          ctx.font = `${Math.max(10, el.height * 0.15)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('点击上传图片', el.x + el.width / 2, el.y + el.height / 2);
        }
        break;
      }
      case 'divider': {
        ctx.fillStyle = '#000000';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        break;
      }
    }
  };

  const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => {
    ctx.fillStyle = '#000000';
    // Outer border
    ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
    // White inner
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
    // Black center
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
  };

  const isFinderArea = (row: number, col: number) => {
    // Top-left
    if (row < 8 && col < 8) return true;
    // Top-right
    if (row < 8 && col > 12) return true;
    // Bottom-left
    if (row > 12 && col < 8) return true;
    return false;
  };

  const handleElementClick = (el: DesignElement) => {
    selectElement(el.id);

    if (el.type === 'text') {
      setEditingTextId(el.id);
      setEditValue((el as TextElement).content);
    }

    if (el.type === 'image' && !(el as ImageElement).src) {
      setShowImagePicker(el.id);
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !showImagePicker) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      updateElement(showImagePicker, { src } as Partial<DesignElement>);
      setShowImagePicker(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTextSave = () => {
    if (editingTextId) {
      updateElement(editingTextId, { content: editValue } as Partial<DesignElement>);
      setEditingTextId(null);
    }
  };

  if (!currentDesign || !spec) {
    return (
      <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">
        请先选择墨水屏规格
      </div>
    );
  }

  // Calculate scale to fit the container
  const containerPadding = 32;

  return (
    <div className="flex h-full gap-4">
      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center"
        style={{
          boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)',
          borderRadius: '16px',
        }}
      >
        <div className="relative">
          {/* E-ink frame border */}
          <div
            className="absolute -inset-3 rounded-lg"
            style={{
              background: '#F5F5F5',
              boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.3)',
            }}
          />

          {/* The actual preview canvas */}
          <canvas
            ref={(el) => {
              previewCanvasRef.current = el;
              if (ref) {
                (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
              }
            }}
            className="relative cursor-pointer"
            style={{
              imageRendering: 'pixelated',
              maxHeight: 'calc(100vh - 280px)',
              maxWidth: '100%',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const scaleX = spec.width / rect.width;
              const scaleY = spec.height / rect.height;
              const x = (e.clientX - rect.left) * scaleX;
              const y = (e.clientY - rect.top) * scaleY;

              // Find clicked element (reverse order for z-index)
              const clicked = [...currentDesign.elements].reverse().find(el =>
                x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height
              );

              if (clicked) {
                handleElementClick(clicked);
              } else {
                selectElement(null);
              }
            }}
          />

          {/* Selection indicator */}
          {selectedElementId && (
            <div
              className="absolute border-2 border-[#6C63FF] pointer-events-none"
              style={{
                left: `${(currentDesign.elements.find(el => el.id === selectedElementId)?.x || 0) / spec.width * 100}%`,
                top: `${(currentDesign.elements.find(el => el.id === selectedElementId)?.y || 0) / spec.height * 100}%`,
                width: `${(currentDesign.elements.find(el => el.id === selectedElementId)?.width || 0) / spec.width * 100}%`,
                height: `${(currentDesign.elements.find(el => el.id === selectedElementId)?.height || 0) / spec.height * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Element properties panel */}
      {selectedElementId && (
        <div
          className="w-48 flex-shrink-0 p-3 rounded-2xl overflow-y-auto"
          style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#3D4852]">属性</span>
            <div className="flex gap-1">
              <button
                onClick={() => removeElement(selectedElementId)}
                className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => selectElement(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#E0E5EC] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {(() => {
            const el = currentDesign.elements.find(e => e.id === selectedElementId);
            if (!el) return null;

            return (
              <div className="space-y-2">
                {el.type === 'text' && (
                  <>
                    <label className="text-[10px] text-[#6B7280]">内容</label>
                    <textarea
                      value={(el as TextElement).content}
                      onChange={(e) => updateElement(el.id, { content: e.target.value } as Partial<DesignElement>)}
                      className="w-full p-2 rounded-xl text-xs resize-none"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)',
                      }}
                      rows={3}
                    />
                    <label className="text-[10px] text-[#6B7280]">字号</label>
                    <input
                      type="range"
                      min={8}
                      max={48}
                      value={(el as TextElement).fontSize}
                      onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) } as Partial<DesignElement>)}
                      className="w-full"
                    />
                    <label className="text-[10px] text-[#6B7280]">对齐</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateElement(el.id, { align } as Partial<DesignElement>)}
                          className="flex-1 py-1 rounded-lg text-[10px]"
                          style={{
                            color: (el as TextElement).align === align ? '#6C63FF' : '#6B7280',
                            boxShadow: (el as TextElement).align === align
                              ? 'inset 2px 2px 4px rgba(163,177,198,0.6), inset -2px -2px 4px rgba(255,255,255,0.5)'
                              : 'none',
                          }}
                        >
                          {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                        </button>
                      ))}
                    </div>
                    <label className="text-[10px] text-[#6B7280]">字体</label>
                    <div className="flex gap-1">
                      {([
                        { key: 'sans', label: '默认' },
                        { key: 'serif', label: '衬线' },
                        { key: 'wenkai', label: '文楷' },
                      ] as const).map(f => (
                        <button
                          key={f.key}
                          onClick={() => updateElement(el.id, { fontFamily: f.key } as Partial<DesignElement>)}
                          className="flex-1 py-1 rounded-lg text-[10px]"
                          style={{
                            color: (el as TextElement).fontFamily === f.key ? '#6C63FF' : '#6B7280',
                            boxShadow: (el as TextElement).fontFamily === f.key
                              ? 'inset 2px 2px 4px rgba(163,177,198,0.6), inset -2px -2px 4px rgba(255,255,255,0.5)'
                              : 'none',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {el.type === 'todo' && (
                  <>
                    <label className="text-[10px] text-[#6B7280]">待办项</label>
                    <div className="space-y-1">
                      {(el as TodoElement).items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => {
                              const items = [...(el as TodoElement).items];
                              items[i] = { ...items[i], done: !items[i].done };
                              updateElement(el.id, { items } as Partial<DesignElement>);
                            }}
                          />
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => {
                              const items = [...(el as TodoElement).items];
                              items[i] = { ...items[i], text: e.target.value };
                              updateElement(el.id, { items } as Partial<DesignElement>);
                            }}
                            className="flex-1 p-1 rounded text-[10px]"
                            style={{
                              background: '#E0E5EC',
                              boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.4), inset -2px -2px 4px rgba(255,255,255,0.4)',
                            }}
                          />
                          <button
                            onClick={() => {
                              const items = (el as TodoElement).items.filter((_, idx) => idx !== i);
                              updateElement(el.id, { items } as Partial<DesignElement>);
                            }}
                            className="text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const items = [...(el as TodoElement).items, { text: '新事项', done: false }];
                        updateElement(el.id, { items } as Partial<DesignElement>);
                      }}
                      className="w-full py-1 rounded-lg text-[10px] text-[#6C63FF]"
                      style={{ boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)' }}
                    >
                      + 添加事项
                    </button>
                  </>
                )}

                {el.type === 'qrcode' && (
                  <>
                    <label className="text-[10px] text-[#6B7280]">内容</label>
                    <input
                      type="text"
                      value={(el as QrCodeElement).content}
                      onChange={(e) => updateElement(el.id, { content: e.target.value } as Partial<DesignElement>)}
                      className="w-full p-2 rounded-xl text-[10px]"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: 'inset 3px 3px 6px rgba(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)',
                      }}
                    />
                  </>
                )}

                {el.type === 'image' && (
                  <button
                    onClick={() => {
                      setShowImagePicker(el.id);
                      fileInputRef.current?.click();
                    }}
                    className="w-full py-2 rounded-xl text-[10px] flex items-center justify-center gap-1"
                    style={{ boxShadow: '3px 3px 6px rgba(163,177,198,0.4), -3px -3px 6px rgba(255,255,255,0.4)' }}
                  >
                    <ImageIcon className="w-3 h-3" />
                    {(el as ImageElement).src ? '更换图片' : '上传图片'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Text editing modal */}
      {editingTextId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={handleTextSave}>
          <div
            className="w-80 p-4 rounded-[32px]"
            style={{
              background: '#E0E5EC',
              boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#3D4852] mb-3">编辑文本</h3>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-3 rounded-2xl text-sm resize-none"
              style={{
                background: '#E0E5EC',
                boxShadow: 'inset 6px 6px 10px rgba(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)',
              }}
              rows={4}
              autoFocus
            />
            <button
              onClick={handleTextSave}
              className="w-full mt-3 py-2 rounded-2xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B84FF)' }}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
