import React, { useEffect } from 'react';
import { useMapEvents, useMap } from 'react-leaflet';
import { debounce } from '../utils/debounce';

export function ViewportUpdater({ blocks, setVisibleBlocks, onBoundsChange }) {
  const map = useMapEvents({
    moveend: debounce(() => {
      const bounds = map.getBounds();
      const zoom = map.getZoom(); // 👈 NY: Hent zoom-nivå
      
      setVisibleBlocks(blocks);

      // Last berre nye adresser ved store endringer:
      if (onBoundsChange) {
        // 👈 NY: Dynamisk limit basert på zoom:
        let limit;
        if (zoom >= 17) limit = 2000;      // Max zoom - vis alt
        else if (zoom >= 16) limit = 1500; // Høg zoom  
        else if (zoom >= 15) limit = 1000; // Medium zoom
        else if (zoom >= 14) limit = 750;  // Låg-medium zoom
        else limit = 500;                  // Låg zoom
        
        console.log(`🔍 Zoom: ${zoom}, Limit: ${limit}`); // Debug

        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          limit: limit // 👈 NY: Send dynamisk limit
        });
      }
    }, 500),
  });

  useEffect(() => {
    if (blocks.length === 0) return;
    const bounds = map.getBounds();
    const filtered = blocks.filter(block =>
      bounds.contains([block.lat, block.lon])
    );
    setVisibleBlocks(filtered);
  }, [blocks, map, setVisibleBlocks]);

  return null;
}
