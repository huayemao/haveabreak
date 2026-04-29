import { useState } from 'react';
import { MediaItem } from '../types';
import { Dictionary } from '@/dictionaries';

interface DownloaderProps {
  media: MediaItem[];
  dict: Dictionary;
}

export default function Downloader({ media, dict }: DownloaderProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [showComplete, setShowComplete] = useState(false);

  const downloadMedia = async (item: MediaItem) => {
    setDownloadingId(item.id);
    setDownloadProgress((prev) => ({ ...prev, [item.id]: 0 }));

    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.title || `media-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadProgress((prev) => ({ ...prev, [item.id]: 100 }));
      setShowComplete(true);
      setTimeout(() => {
        setShowComplete(false);
        setDownloadingId(null);
      }, 2000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadingId(null);
    }
  };

  const downloadAll = async () => {
    for (const item of media) {
      setDownloadingId(item.id);
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.title || `media-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
    setDownloadingId(null);
    setShowComplete(true);
    setTimeout(() => setShowComplete(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-fg-primary">{dict.frame.download}</h2>
        {media.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={downloadingId !== null}
            className="neumorphic-button px-4 py-2 text-sm disabled:opacity-50"
          >
            {dict.frame.download} All
          </button>
        )}
      </div>

      {showComplete && (
        <div className="p-4 rounded-xl bg-accent-sec/20 text-accent-sec text-center">
          {dict.frame.downloadComplete}
        </div>
      )}

      {media.length === 0 ? (
        <div className="text-center py-12 text-fg-muted">
          {dict.frame.noMedia}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-[32px] overflow-hidden"
            >
              <div className="aspect-square bg-muted">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.title || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black/20 flex items-center justify-center">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => downloadMedia(item)}
                  disabled={downloadingId !== null}
                  className="px-4 py-2 bg-white/90 hover:bg-white rounded-full text-fg-primary text-sm font-medium transition-all disabled:opacity-50"
                >
                  {downloadingId === item.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {Math.round(downloadProgress[item.id] || 0)}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {dict.frame.download}
                    </span>
                  )}
                </button>
              </div>

              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm truncate">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}