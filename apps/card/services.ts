export const fetchCoverByIsbn = async (isbn: string): Promise<string> => {
  if (!isbn.trim()) {
    throw new Error('isbn_empty');
  }

  const trimmedIsbn = isbn.trim();

  const oldApiPromise = new Promise<string>((resolve) => {
    fetch(`https://bookcover.longitood.com/bookcover?isbn=${trimmedIsbn}`)
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            resolve(data.url);
            return;
          }
        }
        resolve('');
      })
      .catch(() => {
        resolve('');
      });
  });

  const newApiPromise = new Promise<string>((resolve) => {
    const coverUrl = `https://static.book345.com/covers/s/${trimmedIsbn}.jpg`;
    fetch(coverUrl)
      .then((response) => {
        if (response.ok) {
          resolve(coverUrl);
        } else {
          resolve('');
        }
      })
      .catch(() => {
        resolve('');
      });
  });

  const result = await Promise.race([oldApiPromise, newApiPromise]);

  if (!result) {
    throw new Error('cover_fetch_failed');
  }

  return result;
};