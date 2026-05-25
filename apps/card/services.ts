export const fetchCoverByIsbn = async (isbn: string): Promise<string> => {
  if (!isbn.trim()) {
    throw new Error('isbn_empty');
  }

  const trimmedIsbn = isbn.trim();

  const oldApiPromise = new Promise<string>((resolve, reject) => {
    fetch(`https://bookcover.longitood.com/bookcover?isbn=${trimmedIsbn}`)
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            resolve(data.url);
            return;
          }
        }
        reject(new Error('old_api_failed'));
      })
      .catch(() => {
        reject(new Error('old_api_failed'));
      });
  });

  const newApiPromise = new Promise<string>((resolve, reject) => {
    const coverUrl = `https://static.book345.com/covers/s/${trimmedIsbn}.jpg`;
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('new_api_failed'));
    }, 10000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(coverUrl);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('new_api_failed'));
    };
    img.src = coverUrl;
  });

  try {
    return await Promise.any([oldApiPromise, newApiPromise]);
  } catch {
    throw new Error('cover_fetch_failed');
  }
};