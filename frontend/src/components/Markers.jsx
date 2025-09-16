import React, { useEffect, useState, useRef } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { singleUnitColors, blockRing } from '../colors';
import { getBlockColor } from '../utils/mapUtils';
import { PopupContent } from './PopupContent';
import { SuccessAnimation } from './SuccessAnimation';

export const Markers = React.memo(function Markers({ visibleBlocks, updateUnitStatus }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [openPopupBlockId, setOpenPopupBlockId] = useState(null);
  const [ringExplosion, setRingExplosion] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const explosionTimeoutRef = useRef(null);
  const popupRefs = useRef({});

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => map.off('zoomend', onZoom);
  }, [map]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => () => {
    if (explosionTimeoutRef.current) clearTimeout(explosionTimeoutRef.current);
  }, []);

  // Ingen markørar på låg zoom:
  if (zoom < 15) return null;

  // Status-basert visning:
  let blocksToShow;
  if (zoom < 17) {
    // Zoom 15-16: Vis berre blokker som har fått status (ikkje "Ubehandlet")
    blocksToShow = visibleBlocks.filter(block => {
      return block.units.some(unit => unit.status !== 'Ubehandlet');
    });
    console.log(`🎨 Zoom ${zoom}: Viser ${blocksToShow.length}/${visibleBlocks.length} behandla blokker`);
  } else {
    // Zoom 17+: Vis ALT (behandla + ubehandla)
    blocksToShow = visibleBlocks;
    console.log(`📍 Zoom ${zoom}: Viser alle ${visibleBlocks.length} blokker`);
  }

  const handleStatusUpdate = (blokkId, unitId, newStatus) => {
    updateUnitStatus(blokkId, unitId, newStatus);

    // 🏠 FINN UT OM DET ER ENEBOLIG ELLER BLOKK
    const currentBlock = visibleBlocks.find(block => block.blokkId === blokkId);
    const isBlock = currentBlock && currentBlock.units.length > 1;

    if (newStatus === 'Ja') {
      // 🎯 IMPROVED POSITIONING FOR iPAD/MOBILE
      const block = blocksToShow.find(b => b.blokkId === blokkId);
      if (block) {
        const markerLatLng = L.latLng(block.lat, block.lon);
        const markerPoint = map.latLngToContainerPoint(markerLatLng);
        
        // Get the map container's position relative to viewport
        const mapContainer = map.getContainer();
        const mapRect = mapContainer.getBoundingClientRect();
        
        // Calculate absolute position in viewport
        const absoluteX = mapRect.left + markerPoint.x;
        const absoluteY = mapRect.top + markerPoint.y;
        
        setRingExplosion({ 
          blokkId, 
          unitId, 
          timestamp: Date.now(),
          x: absoluteX,
          y: absoluteY
        });
      } else {
        // Fallback to center
        setRingExplosion({ 
          blokkId, 
          unitId, 
          timestamp: Date.now(),
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });
      }

      explosionTimeoutRef.current = setTimeout(() => {
        setRingExplosion(null);

        // 👈 LUKK POPUP BERRE FOR ENEBOLIG, IKKJE BLOKK!
        if (!isBlock && popupRefs.current[blokkId]) {
          map.closePopup(popupRefs.current[blokkId]);
        }
      }, 1500);
    } else {
      // 🏠 FOR ENEBOLIG: Lukk popup automatisk etter alle registreringar
      if (!isBlock) {
        setTimeout(() => {
          if (popupRefs.current[blokkId]) {
            map.closePopup(popupRefs.current[blokkId]);
          }
        }, 300);
      }
      // 🏢 FOR BLOKK: Hald popup open (gjer ingenting)
    }
  };

  // 📱 MOBILE-OPTIMALISERT STØRRELSER
  const getMarkerRadius = () => {
    return isMobile ? 12 : 10;
  };

  const getBlockRingRadius = () => {
    return isMobile ? 16 : 14;
  };

  const getBorderWeight = () => {
    return isMobile ? 3 : 2;
  };

  return (
    <>
      {/* 🎯 SUCCESS ANIMATION */}
      <SuccessAnimation 
        explosion={ringExplosion}
        isMobile={isMobile}
        onComplete={() => setRingExplosion(null)}
      />

      {blocksToShow.map(({ blokkId, lat, lon, units }) => {
        const isBlock = units.length > 1;
        const color = getBlockColor(units);
        const markerRadius = getMarkerRadius();
        const ringRadius = getBlockRingRadius();
        const borderWeight = getBorderWeight();

        return (
          <React.Fragment key={blokkId}>
            {/* Ring BERRE rundt blokker */}
            {isBlock && (
              <CircleMarker
                center={[lat, lon]}
                radius={ringRadius}
                pathOptions={{
                  ...blockRing,
                  weight: borderWeight
                }}
                interactive={false}
              />
            )}
            
            {/* Alle markers same størrelse */}
            <CircleMarker
              center={[lat, lon]}
              radius={markerRadius}
              pathOptions={{
                color: units.length === 1
                  ? singleUnitColors[units[0].status || 'Ubehandlet'].border
                  : '#000',
                fillColor: units.length === 1
                  ? singleUnitColors[units[0].status || 'Ubehandlet'].fill
                  : color,
                fillOpacity: 0.8,
                weight: borderWeight,
              }}
            >
              <Popup
                ref={(popup) => {
                  if (popup) {
                    popupRefs.current[blokkId] = popup;
                  }
                }}
                autoPan
                autoPanPadding={isMobile ? [40, 40] : [20, 20]}
                maxWidth={isMobile ? 320 : 400}
                maxHeight={window.innerHeight * (isMobile ? 0.6 : 0.7)}
                autoClose={false}
                closeOnClick={true}
              >
                <PopupContent
                  blokkId={blokkId}
                  units={units}
                  isBlock={isBlock}
                  handleStatusUpdate={handleStatusUpdate}
                />
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </>
  );
});
