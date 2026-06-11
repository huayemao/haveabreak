'use client';

import { useMaojiStore } from '@/apps/maoji/store';
import { getEpdSpec } from '@/apps/maoji/epdSpecs';
import { DesignElement } from '@/apps/maoji/types';
import {
  CheckSquare, Calendar, User, QrCode, Quote, Type, Image, Minus, Clock,
} from 'lucide-react';

interface Template {
  id: string;
  label: string;
  icon: React.ElementType;
  apply: (epdWidth: number, epdHeight: number) => Omit<DesignElement, 'id'>[];
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const TEMPLATES: Template[] = [
  {
    id: 'todo',
    label: '待办清单',
    icon: CheckSquare,
    apply: (w, h) => [{
      type: 'todo',
      x: w * 0.08, y: h * 0.05,
      width: w * 0.84, height: h * 0.9,
      items: [
        { text: '早起喝水', done: false },
        { text: '读 30 分钟书', done: false },
        { text: '运动 20 分钟', done: true },
        { text: '写日记', done: false },
      ],
      fontSize: Math.max(12, Math.min(w, h) * 0.06),
    } as DesignElement],
  },
  {
    id: 'calendar',
    label: '日历',
    icon: Calendar,
    apply: (w, h) => [{
      type: 'calendar',
      x: w * 0.05, y: h * 0.05,
      width: w * 0.9, height: h * 0.9,
      showLunar: true,
    } as DesignElement],
  },
  {
    id: 'name-tag',
    label: '姓名牌',
    icon: User,
    apply: (w, h) => [
      {
        type: 'text',
        x: w * 0.1, y: h * 0.15,
        width: w * 0.8, height: h * 0.25,
        content: '张三',
        fontSize: Math.max(24, Math.min(w, h) * 0.15),
        fontFamily: 'sans',
        fontWeight: 'bold',
        align: 'center',
        color: 'black',
      } as DesignElement,
      {
        type: 'text',
        x: w * 0.1, y: h * 0.45,
        width: w * 0.8, height: h * 0.12,
        content: '前端工程师',
        fontSize: Math.max(12, Math.min(w, h) * 0.06),
        fontFamily: 'sans',
        fontWeight: 'normal',
        align: 'center',
        color: 'black',
      } as DesignElement,
      {
        type: 'qrcode',
        x: w * 0.25, y: h * 0.62,
        width: w * 0.5, height: h * 0.3,
        content: 'https://example.com',
      } as DesignElement,
    ],
  },
  {
    id: 'qrcode',
    label: '二维码',
    icon: QrCode,
    apply: (w, h) => [{
      type: 'qrcode',
      x: w * 0.1, y: h * 0.1,
      width: w * 0.8, height: h * 0.8,
      content: 'https://example.com',
    } as DesignElement],
  },
  {
    id: 'quote',
    label: '格言',
    icon: Quote,
    apply: (w, h) => [
      {
        type: 'text',
        x: w * 0.08, y: h * 0.1,
        width: w * 0.84, height: h * 0.6,
        content: '学而不思则罔，思而不学则殆。',
        fontSize: Math.max(14, Math.min(w, h) * 0.07),
        fontFamily: 'wenkai',
        fontWeight: 'normal',
        align: 'center',
        color: 'black',
      } as DesignElement,
      {
        type: 'text',
        x: w * 0.08, y: h * 0.75,
        width: w * 0.84, height: h * 0.15,
        content: '—— 孔子',
        fontSize: Math.max(10, Math.min(w, h) * 0.045),
        fontFamily: 'wenkai',
        fontWeight: 'normal',
        align: 'right',
        color: 'black',
      } as DesignElement,
    ],
  },
  {
    id: 'text',
    label: '自由文本',
    icon: Type,
    apply: (w, h) => [{
      type: 'text',
      x: w * 0.08, y: h * 0.1,
      width: w * 0.84, height: h * 0.3,
      content: '点击编辑文本',
      fontSize: Math.max(14, Math.min(w, h) * 0.07),
      fontFamily: 'sans',
      fontWeight: 'normal',
      align: 'left',
      color: 'black',
    } as DesignElement],
  },
  {
    id: 'image',
    label: '图片',
    icon: Image,
    apply: (w, h) => [{
      type: 'image',
      x: w * 0.05, y: h * 0.05,
      width: w * 0.9, height: h * 0.9,
      src: '',
      dithered: true,
    } as DesignElement],
  },
  {
    id: 'divider',
    label: '分割线',
    icon: Minus,
    apply: (w, h) => [{
      type: 'divider',
      x: w * 0.1, y: h * 0.5,
      width: w * 0.8, height: 2,
      thickness: 2,
    } as DesignElement],
  },
  {
    id: 'clock',
    label: '时钟',
    icon: Clock,
    apply: (w, h) => [{
      type: 'clock',
      x: w * 0.1, y: h * 0.15,
      width: w * 0.8, height: h * 0.35,
      format: '24h',
    } as DesignElement],
  },
];

export default function TemplatePanel() {
  const { currentDesign, addElement } = useMaojiStore();

  if (!currentDesign) return null;

  const spec = getEpdSpec(currentDesign.epdInch);
  if (!spec) return null;

  const handleApplyTemplate = (template: Template) => {
    const elements = template.apply(spec.width, spec.height);
    elements.forEach(el => {
      addElement({ ...el, id: generateId() } as DesignElement);
    });
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {TEMPLATES.map(t => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => handleApplyTemplate(t)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[64px] transition-all duration-300 active:scale-95"
            style={{ boxShadow: '5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)' }}
          >
            <Icon className="w-4 h-4 text-[#6B7280]" />
            <span className="text-[10px] text-[#6B7280] whitespace-nowrap">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
