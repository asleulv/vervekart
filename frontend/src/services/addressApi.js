const ADDRESSES_API_URL = import.meta.env.VITE_ADDRESSES_API_URL;

if (!ADDRESSES_API_URL) {
  throw new Error('VITE_ADDRESSES_API_URL må vere sett i environment variables');
}

export const getAddressesInBounds = async (bounds) => {
  try {
    const response = await fetch(`${ADDRESSES_API_URL}/api/addresses/bounds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.addresses || [];
  } catch (error) {
    console.error('Failed to fetch addresses from API:', error);
    return [];
  }
};
