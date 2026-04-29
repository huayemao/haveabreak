import { MediaType } from '../types';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];

export async function detectMediaType(url: string): Promise<MediaType | null> {
  const lowerUrl = url.toLowerCase();
  
  for (const ext of IMAGE_EXTENSIONS) {
    if (lowerUrl.includes(ext)) {
      return 'image';
    }
  }
  
  for (const ext of VIDEO_EXTENSIONS) {
    if (lowerUrl.includes(ext)) {
      return 'video';
    }
  }
  
  return await detectByLoading(url);
}

async function detectByLoading(url: string): Promise<MediaType | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve('image');
    };
    img.onerror = () => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve('video');
      };
      video.onerror = () => {
        resolve(null);
      };
      video.src = url;
    };
    img.src = url;
  });
}

export function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s'"<>()\[\]{}]+/gi;
  const markdownImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/gi;
  const markdownLinkPattern = /\[([^\]]*)\]\(([^)]+)\)/gi;
  
  const urls: string[] = [];
  
  let match;
  while ((match = markdownImagePattern.exec(text)) !== null) {
    urls.push(match[2]);
  }
  
  while ((match = markdownLinkPattern.exec(text)) !== null) {
    if (!urls.includes(match[2])) {
      urls.push(match[2]);
    }
  }
  
  const plainUrls = text.match(urlPattern) || [];
  plainUrls.forEach(url => {
    if (!urls.includes(url)) {
      urls.push(url);
    }
  });
  
  return urls.filter(url => url.trim());
}

export interface ImportResultItem {
  url: string;
  originalType: MediaType;
  detectedType: MediaType | null;
  status: 'pending' | 'detecting' | 'success' | 'failed';
  error?: string;
}