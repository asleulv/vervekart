import { io } from 'socket.io-client';

class AddressService {
  constructor() {
    this.socket = null;
    this.statusCache = new Map();
    this.pendingUpdates = [];
    this.initWebSocket();
  }

  initWebSocket() {
    this.socket = io('http://localhost:3001'); // Your existing server URL
    
    this.socket.on('status_updated', (data) => {
      this.statusCache.set(data.addressId, {
        status: data.status,
        teamId: data.teamId,
        timestamp: data.timestamp
      });
      
      // Update UI via callback
      if (this.onStatusUpdate) {
        this.onStatusUpdate(data);
      }
    });
  }

  // NEW: Get addresses from your Norwegian database
  async getAddressesInBounds(bounds) {
    try {
      const response = await fetch('https://boligadresser.asle.dev/api/addresses/bounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west,
          limit: 10000 // Adjust based on your needs
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.processAddressData(data.addresses);
    } catch (error) {
      console.error('Failed to fetch addresses from Norwegian database:', error);
      
      // FALLBACK: Try Kartverket if your API fails
      return this.getAddressesFromKartverket(bounds);
    }
  }

  // FALLBACK: Keep the old Kartverket method as backup
  async getAddressesFromKartverket(bounds) {
    try {
      const response = await fetch(
        `https://ws.geonorge.no/adresser/v1/sok?` +
        `nord=${bounds.north}&sor=${bounds.south}&` +
        `ost=${bounds.east}&vest=${bounds.west}&` +
        `utkoordsys=4258&treffPerSide=10000`
      );
      
      const data = await response.json();
      return this.processKartverketData(data);
    } catch (error) {
      console.error('Failed to fetch addresses from Kartverket:', error);
      return [];
    }
  }

  // NEW: Process your Norwegian database data
  processAddressData(addresses) {
    if (!addresses || !Array.isArray(addresses)) return [];
    
    return addresses.map(addr => ({
      id: this.generateAddressIdFromLokalId(addr),
      lat: parseFloat(addr.lat),
      lon: parseFloat(addr.lon),
      adresse: addr.adresse_tekst,
      status: 'Ubehandlet',
      kommunenavn: addr.kommunenavn,
      postnummer: addr.postnummer,
      poststed: addr.poststed,
      lokalid: addr.lokalid // Keep original lokalid
    }));
  }

  // OLD: Keep for Kartverket fallback
  processKartverketData(data) {
    if (!data.adresser) return [];
    
    return data.adresser.map(addr => ({
      id: this.generateAddressId(addr),
      lat: parseFloat(addr.representasjonspunkt?.lat || addr.nord),
      lon: parseFloat(addr.representasjonspunkt?.lon || addr.ost),
      adresse: addr.adressetekst,
      status: 'Ubehandlet',
      kommunenummer: addr.kommunenummer,
      gardsnummer: addr.gardsnummer,
      bruksnummer: addr.bruksnummer
    }));
  }

  // NEW: Generate ID from lokalid (more reliable)
  generateAddressIdFromLokalId(addr) {
    return `lokalid-${addr.lokalid}`;
  }

  // OLD: Keep for Kartverket fallback
  generateAddressId(addr) {
    return `${addr.kommunenummer}-${addr.gardsnummer}-${addr.bruksnummer}`;
  }

  // NEW: Search addresses by text
  async searchAddresses(query, limit = 20) {
    try {
      const response = await fetch(
        `https://boligadresser.asle.dev/api/addresses/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return this.processAddressData(data.addresses);
    } catch (error) {
      console.error('Failed to search addresses:', error);
      return [];
    }
  }

  // NEW: Get addresses near a point
  async getAddressesNearby(lat, lon, radius = 1000, limit = 100) {
    try {
      const response = await fetch('https://boligadresser.asle.dev/api/addresses/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: lat,
          lon: lon,
          radius: radius,
          limit: limit
        })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return this.processAddressData(data.addresses);
    } catch (error) {
      console.error('Failed to fetch nearby addresses:', error);
      return [];
    }
  }

  // Update address status (unchanged - your existing logic)
  async updateStatus(addressId, status, teamId) {
    const updateData = {
      addressId,
      status,
      teamId,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    this.statusCache.set(addressId, updateData);

    try {
      const response = await fetch('http://localhost:3001/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to sync status');
      return await response.json();
    } catch (error) {
      console.error('Failed to sync status, queuing for later:', error);
      this.pendingUpdates.push(updateData);
    }
  }

  // Get current statuses for displayed addresses (unchanged)
  async getStatuses(addressIds) {
    try {
      const response = await fetch('http://localhost:3001/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressIds })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
      return {};
    }
  }

  joinArea(areaId) {
    if (this.socket) {
      this.socket.emit('join_area', areaId);
    }
  }
}

export default new AddressService();
