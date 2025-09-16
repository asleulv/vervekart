import React, { useEffect, useState, useRef } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import { singleUnitColors, blockRing } from '../colors';
import { getBlockColor } from '../utils/mapUtils';
import { PopupContent } from './PopupContent';

export const Markers = React.memo(function Markers({ visibleBlocks, updateUnitStatus }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [openPopupBlockId, setOpenPopupBlockId] = useState(null);
  const [ringExplosion, setRingExplosion] = useState(null);
  const explosionTimeoutRef = useRef(null);
  const popupRefs = useRef({}); // 👈 NY: Referansar til popup-ar

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => map.off('zoomend', onZoom);
  }, [map]);

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
      // 🎯 RING-EKSPLOSJON for alle "Ja"-svar
      setRingExplosion({ blokkId, unitId, timestamp: Date.now() });

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


  return (
    <>
      {/* 🎯 BULLSEYE RING-EKSPLOSJON */}
      {ringExplosion && (
        <>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '6px solid #10b981',
            backgroundColor: 'transparent',
            animation: 'ringExplosion 1.5s ease-out forwards',
            zIndex: 9999,
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '4px solid #059669',
            backgroundColor: 'transparent',
            animation: 'ringExplosion 1.5s ease-out 0.1s forwards',
            zIndex: 9998,
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '3px solid #34d399',
            backgroundColor: 'transparent',
            animation: 'ringExplosion 1.5s ease-out 0.2s forwards',
            zIndex: 9997,
            pointerEvents: 'none'
          }} />

          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '3rem',
            animation: 'centerPulse 1.5s ease-out forwards',
            zIndex: 10000,
            pointerEvents: 'none'
          }}>
            🤩
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes ringExplosion {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            width: 600px;
            height: 600px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes centerPulse {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>

      {blocksToShow.map(({ blokkId, lat, lon, units }) => {
        const isBlock = units.length > 1;
        const color = getBlockColor(units);

        return (
          <React.Fragment key={blokkId}>
            {isBlock && (
              <CircleMarker
                center={[lat, lon]}
                radius={14}
                pathOptions={blockRing}
                interactive={false}
              />
            )}
            <CircleMarker
              center={[lat, lon]}
              radius={10}
              pathOptions={{
                color: units.length === 1
                  ? singleUnitColors[units[0].status || 'Ubehandlet'].border
                  : '#000',
                fillColor: units.length === 1
                  ? singleUnitColors[units[0].status || 'Ubehandlet'].fill
                  : color,
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup
                ref={(popup) => {
                  if (popup) {
                    popupRefs.current[blokkId] = popup; // 👈 LAGRE REFERANSE
                  }
                }}
                autoPan
                autoPanPadding={[20, 20]}
                maxWidth={400}
                maxHeight={window.innerHeight * 0.7}
                autoClose={false}  // 👈 ENDRA: La oss kontrollere lukkinga manuelt
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
