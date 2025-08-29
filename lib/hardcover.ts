const HARDCOVER_BASE_URL = "https://api.hardcover.app/v1/graphql";

async function fetchHardcoverGraphQL(operation: string) {
  try {
    const response = await fetch(HARDCOVER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HARDCOVER_TOKEN}`
      },
      body: JSON.stringify({ query: operation })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Hardcover API error:', error);
    throw new Error('Failed to fetch data from Hardcover');
  }
}

type HardcoverBook = {
  id: number;
  title: string;
  image: {
    url: string;
  };
  contributions: {
    author: {
      name: string;
    };
  }[];
  slug: string;
};

type BookData = {
  title: string;
  author: string;
  url: string;
  imageUrl: string;
};

export async function getCurrentlyReading(): Promise<{
  currentlyReading: BookData[];
  lastCompleted: BookData | null;
}> {
  const username = process.env.HARDCOVER_USERNAME;
  
  if (!username) {
    throw new Error('HARDCOVER_USERNAME environment variable is required');
  }

  const operation = `
    query GetCurrentlyReading {
      currentlyReading: me {
        user_books(
          where: { _and: [{ status_id: { _eq: 2 } }, { privacy_setting_id: { _neq: 3 } }] }
          order_by: { updated_at: desc }
          limit: 3
        ) {
          book {
            id
            title
            image {
              url
            }
            contributions {
              author {
                name
              }
            }
            slug
          }
        }
      }
      recentlyCompleted: me {
        user_books(
          where: { _and: [{ status_id: { _eq: 3 } }, { privacy_setting_id: { _neq: 3 } }] }
          order_by: { updated_at: desc }
          limit: 1
        ) {
          book {
            id
            title
            image {
              url
            }
            contributions {
              author {
                name
              }
            }
            slug
          }
        }
      }
    }
  `;

  try {
    const response = await fetchHardcoverGraphQL(operation);
    
    const currentlyReadingBooks = response?.data?.currentlyReading[0]?.user_books || [];
    const recentlyCompletedBooks = response?.data?.recentlyCompleted[0]?.user_books || [];

    const currentlyReading: BookData[] = currentlyReadingBooks.map((userBook: { book: HardcoverBook }) => ({
      title: userBook.book.title,
      author: userBook.book.contributions[0]?.author?.name || 'Unknown Author',
      url: `https://hardcover.app/books/${userBook.book.slug}`,
      imageUrl: userBook.book.image?.url || '',
    }));

    const lastCompleted: BookData | null = recentlyCompletedBooks.length > 0 
      ? {
          title: recentlyCompletedBooks[0].book.title,
          author: recentlyCompletedBooks[0].book.contributions[0]?.author?.name || 'Unknown Author',
          url: `https://hardcover.app/books/${recentlyCompletedBooks[0].book.slug}`,
          imageUrl: recentlyCompletedBooks[0].book.image?.url || '',
        }
      : null;

    return {
      currentlyReading,
      lastCompleted,
    };
  } catch (error) {
    console.error('Error fetching reading data:', error);
    return {
      currentlyReading: [],
      lastCompleted: null,
    };
  }
}
