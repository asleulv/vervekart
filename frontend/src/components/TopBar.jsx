import React, { useState, useEffect } from 'react';

export function TopBar({ currentUser, onUserSet, triggerUpdate, onLocationFound }) {
  const [stats, setStats] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(null);
  const [showDaily, setShowDaily] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stats fetching (same as before)
  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        const endpoint = showDaily ? '/daily-stats' : '/advanced-stats';
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}${endpoint}`);
        const data = await response.json();
        
        const userActivity = data.user_activity?.find(u => u.changed_by_name === currentUser.name) || {};
        
        const newStats = {
          total: userActivity.total_changes || 0,
          ja: userActivity.ja_count || 0,
          nei: userActivity.nei_count || 0,
          ikke_hjemme: userActivity.ikke_hjemme_count || 0,
          period: showDaily ? 'I dag' : 'Totalt'
        };
        
        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [currentUser, triggerUpdate, showDaily]);

  // Geolocation (same function)
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
        
        setLastAccuracy(Math.round(accuracy));
        
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
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
        zIndex: 1000,
        fontFamily: 'system-ui'
      }}>
        
        {/* VENSTRE SIDE - Logo og User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
          {/* Logo - berre på desktop */}
          {!isMobile && (
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              color: '#1f2937'
            }}>
              🗳️ Vervekart
            </div>
          )}
          
          {/* USER INFO - Clean flat design */}
          <div style={{
            background: '#f3f4f6',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span>👤</span>
            <span>{currentUser.name}</span>
            {lastAccuracy && lastAccuracy <= 100 && (
              <span style={{ fontSize: '12px', opacity: 0.6 }}>📍</span>
            )}
          </div>
          
          {/* LOCATION BUTTON - Clean blue button */}
          <button
            onClick={findMyLocation}
            disabled={locationLoading}
            title={locationLoading ? 'Hentar posisjon...' : lastAccuracy ? `Finn meg (±${lastAccuracy}m)` : 'Finn min posisjon'}
            style={{
              background: locationLoading ? '#9ca3af' : '#3b82f6',
              border: 'none',
              color: 'white',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              cursor: locationLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!locationLoading) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!locationLoading) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {locationLoading ? '⏳' : '🎯'}
          </button>
        </div>

        {/* SENTER - Clean flat statistics */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '12px',
        }}>
          {stats ? (
            <>
              {/* JA - clean green */}
              <div style={{ 
                background: '#dcfce7',
                color: '#166534',
                padding: '8px 12px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span>✅</span>
                <span>{stats.ja}</span>
              </div>
              
              {/* NEI - clean red */}
              <div style={{ 
                background: '#fee2e2',
                color: '#991b1b',
                padding: '8px 12px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span>❌</span>
                <span>{stats.nei}</span>
              </div>
              
              {/* IKKE HJEMME - clean gray */}
              <div style={{ 
                background: '#f3f4f6',
                color: '#374151',
                padding: '8px 12px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span>🚪</span>
                <span>{stats.ikke_hjemme}</span>
              </div>
              
              {/* TOGGLE BUTTON - clean design */}
              {!isMobile && (
                <button
                  onClick={() => setShowDaily(!showDaily)}
                  style={{
                    background: '#e0e7ff',
                    color: '#3730a3',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#c7d2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#e0e7ff';
                  }}
                >
                  <span>{showDaily ? '📅' : '📊'}</span>
                  <span>{stats.period}: {stats.total}</span>
                </button>
              )}
            </>
          ) : (
            <div style={{ 
              color: '#9ca3af', 
              fontSize: isMobile ? '12px' : '14px',
              fontStyle: 'italic'
            }}>
              Hentar...
            </div>
          )}
        </div>

        {/* HØGRE SIDE - Clean red logout button */}
        <button 
          onClick={() => onUserSet(null)}
          title="Logg ut"
          style={{
            background: '#ef4444',
            border: 'none',
            color: 'white',
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ef4444';
          }}
        >
          ✕
        </button>
      </div>

      {/* GPS Warning - clean design */}
      {lastAccuracy && lastAccuracy > 100 && (
        <div style={{
          position: 'fixed',
          top: '76px',
          right: '20px',
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1001,
          fontWeight: '500'
        }}>
          ⚠️ GPS unøyaktig (±{lastAccuracy}m)
        </div>
      )}
    </>
  );
}
