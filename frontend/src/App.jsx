import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ViewportUpdater } from './components/ViewportUpdater';
import { Markers } from './components/Markers';
import { UserLogin } from './components/UserLogin';
import { TopBar } from './components/TopBar';
import { UserLocationMarker } from './components/UserLocationMarker'; // 👈 NY: Import brukar-posisjon
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
  const [userLocation, setUserLocation] = useState(null); // 👈 NY: Brukar sin posisjon

  const loadAddressesForBounds = useCallback(async (bounds) => {
    setLoading(true);
    try {
      // Hent både adresser og eksisterande statusar parallelt
      const [addresses, statusData] = await Promise.all([
        getAddressesInBounds(bounds),
        statusApi.getStatuses()
      ]);

      console.log(`📊 Got ${addresses.length} addresses and ${Object.keys(statusData.statuses || {}).length} saved statuses`);

      const savedStatuses = statusData.statuses || {};

      const allUnits = addresses.map((addr, index) => {
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
    }
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

  const updateUnitStatus = useCallback(async (blokkId, unitId, newStatus) => {
    // Sjekk at brukar er logga inn
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
        // 💾 SEND BRUKARINFO TIL BACKEND
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

        // Oppdater UI
        setBlocks(blocks =>
          blocks.map(block => {
            if (block.blokkId !== blokkId) return block;
            const updatedUnits = block.units.map(unit =>
              unit.id === unitId ? { ...unit, status: newStatus } : unit
            );
            return { ...block, units: updatedUnits };
          })
        );

        console.log('✅ UI updated');

        // 🚀 TRIGGER UMIDDELBAR STATS-OPPDATERING
        setTriggerStatsUpdate(prev => prev + 1);

      } catch (error) {
        console.error('❌ Failed to save status:', error);
        alert('Kunne ikkje lagre status. Sjekk at backend køyrer og prøv igjen.');
      }
    }
  }, [blocks, currentUser]);

  // 📍 HANDTER GEOLOKALISERING
  const handleLocationFound = useCallback((location) => {
    if (mapInstance) {
      console.log(`📍 Flytt kart til: ${location.lat}, ${location.lon}`);

      // 👈 LAGRE BRUKAR-POSISJON
      setUserLocation({
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy || null,
        timestamp: Date.now()
      });

      // Smooth flyTo-animasjon til brukar sin posisjon MED MEIR ZOOM
      mapInstance.flyTo([location.lat, location.lon], 18, {
        animate: true,
        duration: 1.5
      });

      // Last inn adresser for det nye området (mindre område pga høgare zoom)
      const bounds = {
        north: location.lat + 0.005,
        south: location.lat - 0.005,
        east: location.lon + 0.005,
        west: location.lon - 0.005
      };

      loadAddressesForBounds(bounds);
    }
  }, [mapInstance, loadAddressesForBounds]);

  // 🗺️ HANDTER MAP-REFERANSE
  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
    console.log('🗺️ Map instance ready');
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* 🔄 TOPBAR MED GEOLOKALISERING */}
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

      {loading && (
        <div style={{
          position: 'absolute',
          top: currentUser ? '80px' : '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          fontFamily: 'system-ui'
        }}>
          🔄 Henter adresser...
        </div>
      )}

      <div style={{
        marginTop: currentUser ? '60px' : '0',
        height: currentUser ? 'calc(100vh - 60px)' : '100vh'
      }}>
        <MapContainer
          center={[59.929196, 10.600293]}
          zoom={15}
          style={{ height: '100%', width: '100vw' }}
          scrollWheelZoom
          dragging
          doubleClickZoom
          zoomControl
          whenReady={(e) => handleMapReady(e.target)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ViewportUpdater
            blocks={blocks}
            setVisibleBlocks={setVisibleBlocks}
            onBoundsChange={loadAddressesForBounds}
          />
          <Markers visibleBlocks={visibleBlocks} updateUnitStatus={updateUnitStatus} />

          {/* 👈 NY: BRUKAR-POSISJON MARKØR */}
          <UserLocationMarker
            position={userLocation}
            accuracy={userLocation?.accuracy}
          />
        </MapContainer>
      </div>
    </div>
  );
}
