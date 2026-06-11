// ─── EPD Screen Specs ─────────────────────────────────────────────────────────

export type EpdColorMode = 2 | 3 | 4; // 2=BW, 3=BWR, 4=4G

export interface EpdSpec {
  inch: number;       // e.g. 213 for "2.13"
  label: string;      // e.g. "2.13 寸"
  width: number;      // pixels
  height: number;     // pixels
  supportedColors: EpdColorMode[];
  // raw byte fields for initCmd encoding
  sizeCode: string;   // 2-byte hex for A0 start command
  colorCodes: Record<EpdColorMode, { initCmd1: string; initCmd2: string }>;
}

// ─── Design Canvas Elements ───────────────────────────────────────────────────

export type ElementType =
  | 'text'
  | 'image'
  | 'qrcode'
  | 'divider'
  | 'todo'
  | 'calendar'
  | 'clock';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: 'sans' | 'serif' | 'wenkai';
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  color: 'black' | 'white' | 'red';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;          // data URL
  dithered: boolean;
}

export interface QrCodeElement extends BaseElement {
  type: 'qrcode';
  content: string;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  thickness: number;
}

export interface TodoElement extends BaseElement {
  type: 'todo';
  items: { text: string; done: boolean }[];
  fontSize: number;
}

export interface CalendarElement extends BaseElement {
  type: 'calendar';
  showLunar: boolean;
}

export interface ClockElement extends BaseElement {
  type: 'clock';
  format: '12h' | '24h';
}

export type DesignElement =
  | TextElement
  | ImageElement
  | QrCodeElement
  | DividerElement
  | TodoElement
  | CalendarElement
  | ClockElement;

// ─── Design (Saved Work) ──────────────────────────────────────────────────────

export interface Design {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  epdInch: number;
  epdColor: EpdColorMode;
  elements: DesignElement[];
  thumbnail?: string; // data URL
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface MaojiSettings {
  lastEpdInch: number;
  lastEpdColor: EpdColorMode;
  useDithering: boolean;
}

// ─── NFC Write Status ────────────────────────────────────────────────────────

export type NfcStatus =
  | 'idle'
  | 'ready'       // waiting for tag tap
  | 'writing'
  | 'success'
  | 'error';

export interface NfcState {
  status: NfcStatus;
  progress: number;   // 0-100
  message: string;
}
