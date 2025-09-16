import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ViewportUpdater } from './components/ViewportUpdater';
import { Markers } from './components/Markers';
import { UserLogin } from './components/UserLogin';
import { TopBar } from './components/TopBar';
import { UserLocationMarker } from './components/UserLocationMarker';
import { getAddressesInBounds } from './services/addressApi';
import { statusApi } from './services/statusApi';
import { getCenter, createBlockId } from './utils/mapUtils';

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function App() {
  const [units, setUnits] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [visibleBlocks, setVisibleBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [triggerStatsUpdate, setTriggerStatsUpdate] = useState(0);
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  // 📱 MOBILE OPTIMALISERING
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🚀 OPTIMALISERT ADDRESS LOADING med debouncing og caching
  const loadAddressesForBounds = useCallback(async (bounds) => {
    // DEBOUNCING - unngå for mange API calls
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Sjekk om bounds er for like siste kall (cache-like behavior)
    const boundsString = `${bounds.north}-${bounds.south}-${bounds.east}-${bounds.west}`;
    if (lastBoundsRef.current === boundsString) {
      console.log('🎯 Skip loading - same bounds');
      return;
    }
    lastBoundsRef.current = boundsString;

    setDebouncedLoading(true);
    
    loadingTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        console.log('📡 Loading addresses for bounds:', bounds);

        // 📱 MOBILE: Reducer data load på mobile
        const maxAddresses = isMobile ? 200 : 500;
        
        const [addresses, statusData] = await Promise.all([
          getAddressesInBounds(bounds),
          statusApi.getStatuses()
        ]);

        // Limit addresses på mobile for ytelse
        const limitedAddresses = isMobile 
          ? addresses.slice(0, maxAddresses)
          : addresses;

        console.log(`📊 Got ${limitedAddresses.length}/${addresses.length} addresses and ${Object.keys(statusData.statuses || {}).length} saved statuses`);

        const savedStatuses = statusData.statuses || {};

        const allUnits = limitedAddresses.map((addr, index) => {
          const blokkId = createBlockId(addr);
          const savedStatus = savedStatuses[addr.lokalid] || 'Ubehandlet';

          return {
            id: `${addr.lokalid}-${index}`,
            lat: parseFloat(addr.lat),
            lon: parseFloat(addr.lon),
            adresse: addr.adresse_tekst,
            status: savedStatus,
            blokkId,
            lokalid: addr.lokalid,
            kommunenavn: addr.kommunenavn,
            postnummer: addr.postnummer,
            poststed: addr.poststed,
            fylke: addr.fylke || 'ukjent'
          };
        });

        setUnits(allUnits);

        const grouped = allUnits.reduce((acc, unit) => {
          if (!acc[unit.blokkId]) acc[unit.blokkId] = [];
          acc[unit.blokkId].push(unit);
          return acc;
        }, {});

        const blocksArray = Object.entries(grouped).map(([blokkId, units]) => {
          const center = getCenter(units);
          return {
            blokkId,
            lat: center.lat,
            lon: center.lon,
            units,
          };
        });

        setBlocks(blocksArray);
        setVisibleBlocks(blocksArray);
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoading(false);
        setDebouncedLoading(false);
      }
    }, isMobile ? 300 : 150); // Lenger debounce på mobile
  }, [isMobile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initialBounds = {
      north: 59.94,
      south: 59.91,
      east: 10.78,
      west: 10.58
    };
    loadAddressesForBounds(initialBounds);
  }, [loadAddressesForBounds]);

  // 🎯 MEMOIZED UPDATE FUNCTION
  const updateUnitStatus = useCallback(async (blokkId, unitId, newStatus) => {
    if (!currentUser) {
      alert('Du må logge inn først!');
      return;
    }

    const unit = blocks
      .find(b => b.blokkId === blokkId)
      ?.units
      .find(u => u.id === unitId);

    if (unit) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/save-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lokalid: unit.lokalid,
            status: newStatus,
            address_text: unit.adresse,
            kommune: unit.kommunenavn,
            fylke: unit.fylke || 'ukjent',
            user_id: currentUser.id,
            user_name: currentUser.name
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save status');
        }

        const result = await response.json();
        console.log('✅ Status saved with full history:', result);

        // Optimized UI update - avoid full re-render
        setBlocks(prevBlocks =>
          prevBlocks.map(block => {
            if (block.blokkId !== blokkId) return block;
            const updatedUnits = block.units.map(unit =>
              unit.id === unitId ? { ...unit, status: newStatus } : unit
            );
            return { ...block, units: updatedUnits };
          })
        );

        setTriggerStatsUpdate(prev => prev + 1);

      } catch (error) {
        console.error('❌ Failed to save status:', error);
        alert('Kunne ikkje lagre status. Sjekk at backend køyrer og prøv igjen.');
      }
    }
  }, [blocks, currentUser]);

  // 📍 OPTIMIZED GEOLOCATION med mindre bounds på mobile
  const handleLocationFound = useCallback((location) => {
    if (mapInstance) {
      console.log(`📍 Flytt kart til: ${location.lat}, ${location.lon}`);

      setUserLocation({
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy || null,
        timestamp: Date.now()
      });

      // Mobile: høgare zoom og mindre bounds
      const zoomLevel = isMobile ? 18 : 17;
      const boundsSize = isMobile ? 0.003 : 0.005;

      mapInstance.flyTo([location.lat, location.lon], zoomLevel, {
        animate: true,
        duration: isMobile ? 2.0 : 1.5 // Litt seinare på mobile
      });

      const bounds = {
        north: location.lat + boundsSize,
        south: location.lat - boundsSize,
        east: location.lon + boundsSize,
        west: location.lon - boundsSize
      };

      loadAddressesForBounds(bounds);
    }
  }, [mapInstance, loadAddressesForBounds, isMobile]);

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
    console.log('🗺️ Map instance ready');
    
    // 📱 MOBILE MAP OPTIMALISERING
    if (isMobile) {
      // Disable double-click zoom på mobile (kan forstyrre touch)
      map.doubleClickZoom.disable();
      
      // Mindre smooth panning på mobile for ytelse
      map.options.zoomAnimationThreshold = 2;
    }
  }, [isMobile]);

  return (
    <div style={{ position: 'relative' }}>
      {currentUser ? (
        <TopBar
          currentUser={currentUser}
          onUserSet={setCurrentUser}
          triggerUpdate={triggerStatsUpdate}
          onLocationFound={handleLocationFound}
        />
      ) : (
        <UserLogin currentUser={currentUser} onUserSet={setCurrentUser} />
      )}

      {(loading || debouncedLoading) && (
        <div style={{
          position: 'absolute',
          top: currentUser ? '80px' : '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: isMobile ? '8px 16px' : '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          fontFamily: 'system-ui',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          🔄 Henter adresser...
        </div>
      )}

      <div style={{
        marginTop: currentUser ? '64px' : '0', // Match TopBar height
        height: currentUser ? 'calc(100vh - 64px)' : '100vh'
      }}>
        <MapContainer
          center={[59.929196, 10.600293]}
          zoom={15}
          style={{ height: '100%', width: '100vw' }}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={!isMobile} // Disable på mobile
          zoomControl={true}
          whenReady={(e) => handleMapReady(e.target)}
          // 📱 MOBILE PERFORMANCE SETTINGS
          preferCanvas={isMobile} // Bruk canvas rendering på mobile
          zoomSnap={isMobile ? 1 : 0.5} // Snap til heiltal zoom på mobile
          zoomAnimationThreshold={isMobile ? 2 : 4}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            // 📱 MOBILE TILE OPTIMALISERING
            maxZoom={isMobile ? 18 : 19}
            tileSize={isMobile ? 256 : 256}
            updateWhenZooming={!isMobile} // Mindre updates på mobile
          />
          <ViewportUpdater
            blocks={blocks}
            setVisibleBlocks={setVisibleBlocks}
            onBoundsChange={loadAddressesForBounds}
          />
          <Markers visibleBlocks={visibleBlocks} updateUnitStatus={updateUnitStatus} />
          <UserLocationMarker
            position={userLocation}
            accuracy={userLocation?.accuracy}
          />
        </MapContainer>
      </div>
    </div>
  );
}
