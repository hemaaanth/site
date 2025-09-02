interface CoffeeData {
  coffee: string;
  roaster: string;
  averageRating: number;
  totalRatings: number;
  imageUrl: string;
}

export async function getCurrentCoffee(): Promise<CoffeeData | null> {
  try {
    const response = await fetch('https://coffee.hem.so/api/v1/current-coffee', {
      headers: {
        'X-API-Key': process.env.COFFEE_API_KEY || ''
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch coffee data:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching coffee data:', error);
    return null;
  }
}
