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
    
    // Only return the fields we actually need to reduce payload size
    return {
      coffee: data.coffee || '',
      roaster: data.roaster || '',
      averageRating: data.averageRating || 0,
      totalRatings: data.totalRatings || 0,
      imageUrl: data.imageUrl || '',
    };
  } catch (error) {
    console.error('Error fetching coffee data:', error);
    return null;
  }
}
