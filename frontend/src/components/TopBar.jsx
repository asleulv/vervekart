import React, { useState, useEffect } from 'react';

export function TopBar({ currentUser, onUserSet, triggerUpdate, onLocationFound }) {
  const [stats, setStats] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(null);
  const [showDaily, setShowDaily] = useState(true); // 👈 NY: Standard = "I dag"

  // Automatisk oppdatering av statistikk
  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        // 👈 VELG ENDPOINT basert på brytar
        const endpoint = showDaily ? '/daily-stats' : '/advanced-stats';
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}${endpoint}`);
        const data = await response.json();
        
        const userActivity = data.user_activity?.find(u => u.changed_by_name === currentUser.name) || {};
        
        const newStats = {
          total: userActivity.total_changes || 0,
          ja: userActivity.ja_count || 0,
          nei: userActivity.nei_count || 0,
          ikke_hjemme: userActivity.ikke_hjemme_count || 0,
          period: showDaily ? 'I dag' : 'Totalt' // 👈 For visning
        };
        
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [currentUser, triggerUpdate, showDaily]); // 👈 Legg til showDaily som dependency

  // 📍 FINN MIN POSISJON MED HØGARE PRESISJON
  const findMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalisering er ikkje støtta i din nettlesar');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Posisjon: ${latitude}, ${longitude} (±${Math.round(accuracy)}m)`);
        
        // 👈 LAGRE NØYAKTIGHEIT
        setLastAccuracy(Math.round(accuracy));
        
        // Send posisjon med accuracy til App.jsx
        if (onLocationFound) {
          onLocationFound({ 
            lat: latitude, 
            lon: longitude,
            accuracy: accuracy
          });
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Kunne ikkje finne posisjonen din';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Du må tillate tilgang til posisjon i nettlesaren';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Posisjonsinformasjon er ikkje tilgjengeleg';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tidsavbrudd ved henting av posisjon (prøv utandørs)';
            break;
        }
        
        alert(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  if (!currentUser) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui'
      }}>
        {/* VENSTRE SIDE - Logo og brukar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            🗳️ Vervekart
          </div>
          <div style={{ 
            background: 'rgba(25, 166, 217, 0.96)', 
            padding: '8px 12px', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '14px' }}>👤</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{currentUser.name}</span>
          </div>
        </div>

        {/* SENTER - Statistikk med brytar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          fontSize: '14px'
        }}>
          {stats ? (
            <>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.2)', 
                padding: '4px 8px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>✅</span>
                <span>{stats.ja}</span>
              </div>
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.2)', 
                padding: '4px 8px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>❌</span>
                <span>{stats.nei}</span>
              </div>
              <div style={{ 
                background: 'rgba(156, 163, 175, 0.2)', 
                padding: '4px 8px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>🚪</span>
                <span>{stats.ikke_hjemme}</span>
              </div>
              
              {/* 🔄 BRYTAR-KNAPP */}
              <button
                onClick={() => setShowDaily(!showDaily)}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{showDaily ? '📅' : '📊'}</span>
                <span>{stats.period}: {stats.total}</span>
              </button>
            </>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Hentar statistikk...
            </div>
          )}
        </div>

        {/* HØGRE SIDE - Geolokalisering og logg ut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 📍 FINN MEG-KNAPP MED ACCURACY */}
          <button 
            onClick={findMyLocation}
            disabled={locationLoading}
            style={{
              background: locationLoading ? 'rgba(156, 163, 175, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: locationLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              outline: 'none'
            }}
          >
            <span>{locationLoading ? '⏳' : '📍'}</span>
            <span>
              {locationLoading 
                ? 'Hentar...' 
                : lastAccuracy 
                  ? `Finn meg (±${lastAccuracy}m)` 
                  : 'Finn meg'
              }
            </span>
          </button>

          <button 
            onClick={() => onUserSet(null)}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            Logg ut
          </button>
        </div>
      </div>

      {/* 📍 GPS NØYAKTIGHEITS-ÅTVARING */}
      {lastAccuracy && lastAccuracy > 100 && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          zIndex: 1001,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          ⚠️ GPS unøyaktig (±{lastAccuracy}m). Gå utandørs for betre presisjon.
        </div>
      )}
    </>
  );
}
