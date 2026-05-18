export const fetchCoverByIsbn = async (isbn: string): Promise<string> => {
  if (!isbn.trim()) {
    return '';
  }

  let coverUrl = '';

  try {
    const response = await fetch(`https://bookcover.longitood.com/bookcover?isbn=${isbn.trim()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        coverUrl = data.url;
      }
    }
  } catch (error) {
    console.error('Failed to fetch cover from old API:', error);
  }

  if (!coverUrl) {
    coverUrl = `https://static.book345.com/covers/s/${isbn.trim()}.jpg`;
  }

  return coverUrl;
};