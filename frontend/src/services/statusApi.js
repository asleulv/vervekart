// frontend/src/services/statusApi.js

// Environment-variabel UTAN fallback
const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

if (!API_BASE) {
  throw new Error('VITE_BACKEND_API_URL må vere sett i environment variables');
}

export const statusApi = {
  async saveStatus(unitData, status) {
    console.log('💾 Saving status:', unitData.adresse, '->', status);
    
    const response = await fetch(`${API_BASE}/save-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lokalid: unitData.lokalid,
        status: status,
        address_text: unitData.adresse,
        kommune: unitData.kommunenavn,
        fylke: unitData.fylke || 'ukjent'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save status');
    }
    
    return response.json();
  },

  async getStatuses() {
    console.log('📡 Fetching saved statuses...');
    
    const response = await fetch(`${API_BASE}/get-statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch statuses');
    }
    
    return response.json();
  },

   async getStatusesInBounds(bounds) {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/get-statuses-bounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bounds)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch statuses in bounds');
    }
    
    return response.json();
  }
};
