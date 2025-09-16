import React from 'react';
import { CircleMarker } from 'react-leaflet';

export function UserLocationMarker({ position, accuracy }) {
  if (!position) return null;

  return (
    <>
      {/* NØYAKTIGHEITS-SIRKEL (viser kor nøyaktig GPS er) */}
      {accuracy && (
        <CircleMarker
          center={[position.lat, position.lon]}
          radius={Math.min(accuracy / 10, 50)} // Skaler ned accuracy til passande radius
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 1,
            dashArray: '5, 5' // Stipla linje
          }}
        />
      )}
      
      {/* DIN POSISJON - hovud-markør */}
      <CircleMarker
        center={[position.lat, position.lon]}
        radius={12}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 3
        }}
      />
      
      {/* SENTERPUNKT - liten kvit prikk */}
      <CircleMarker
        center={[position.lat, position.lon]}
        radius={4}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 0
        }}
      />
    </>
  );
}
