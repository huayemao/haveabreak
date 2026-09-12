// Persistent Video Thumbnail Manager & Poster Helpers

const DB_NAME = 'haveabreak_frame_cache';
const STORE_NAME = 'video_thumbnails';
const DB_VERSION = 1;

// A 1x1 transparent SVG poster to prevent Android WebView / Chromium from rendering its native gray play button placeholder
export const TRANSPARENT_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

// Generate an elegant SVG gradient poster fallback
export function generateVideoPoster(title?: string): string {
  const safeTitle = (title || 'Video')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="400" cy="560" r="50" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <polygon points="392,542 418,560 392,578" fill="rgba(255,255,255,0.9)"/>
      <text x="400" y="650" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="20" font-weight="500" text-anchor="middle">
        ${safeTitle}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

// In-memory cache
const memoryCache = new Map<string, string>();
// In-flight extraction promises to prevent duplicate requests
const inFlightPromises = new Map<string, Promise<string | null>>();

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getFromDb(key: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToDb(key: string, value: string): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Robust offscreen video thumbnail extractor
 * Does NOT use display:none so mobile Chromium/WebKit allocates decoders
 */
function extractThumbnailFromVideo(videoUrl: string): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    // Position offscreen without display:none so browser decodes frames
    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.top = '-9999px';
    video.style.width = '32px';
    video.style.height = '32px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    let resolved = false;
    const cleanup = () => {
      if (video.parentNode) {
        document.body.removeChild(video);
      }
      video.removeAttribute('src');
      video.load();
    };

    const finish = (result: string | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    // Fail-safe timeout (3.5s)
    const timeout = setTimeout(() => {
      finish(null);
    }, 3500);

    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        clearTimeout(timeout);
        finish(dataUrl);
      } catch {
        // e.g. Tainted canvas
        clearTimeout(timeout);
        finish(null);
      }
    };

    video.addEventListener('seeked', captureFrame, { once: true });

    video.addEventListener('loadeddata', () => {
      try {
        // Seek to 0.1s or 5% of video to capture a meaningful first frame
        video.currentTime = Math.min(0.2, (video.duration || 1) * 0.05);
      } catch {
        captureFrame();
      }
    }, { once: true });

    video.addEventListener('error', () => {
      clearTimeout(timeout);
      finish(null);
    }, { once: true });

    document.body.appendChild(video);
    video.src = videoUrl;
  });
}

/**
 * Get or extract video thumbnail with memory & IndexedDB caching
 */
export async function getVideoThumbnail(url: string, id?: string): Promise<string | null> {
  if (!url) return null;

  const cacheKey = id || url;

  // 1. Check memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check in-flight extraction
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const extractionPromise = (async () => {
    try {
      // 3. Check IndexedDB
      const stored = await getFromDb(cacheKey);
      if (stored) {
        memoryCache.set(cacheKey, stored);
        return stored;
      }

      // 4. Extract from video
      const extracted = await extractThumbnailFromVideo(url);
      if (extracted) {
        memoryCache.set(cacheKey, extracted);
        await saveToDb(cacheKey, extracted);
        return extracted;
      }

      return null;
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  })();

  inFlightPromises.set(cacheKey, extractionPromise);
  return extractionPromise;
}
