import React from 'react';
import { singleUnitColors } from '../colors';

export function PopupContent({ blokkId, units, isBlock, handleStatusUpdate }) {
  // Grupér leiligheiter etter etasje for blokker
  const groupByFloor = (units) => {
    const grouped = units.reduce((acc, unit) => {
      // Ekstrahér etasje frå adresse: "H0201" → "02", "K0108" → "K", "U0102" → "U"
      const match = unit.adresse.match(/-([HKLU])(\d{2})\d{2}$/);
      if (match) {
        const [, prefix, floor] = match;
        
        let floorName;
        if (prefix === 'K') floorName = 'Kjeller';
        else if (prefix === 'U') floorName = 'Underetasje';
        else if (prefix === 'H') {
          const floorNum = parseInt(floor);
          if (floorNum === 0) floorName = 'Bakkeplan';
          else floorName = `${floorNum}. etasje`;
        }
        else floorName = `Etasje ${floor}`;
        
        if (!acc[floorName]) acc[floorName] = [];
        acc[floorName].push(unit);
      } else {
        // Fallback for ukjende format:
        if (!acc['Andre']) acc['Andre'] = [];
        acc['Andre'].push(unit);
      }
      return acc;
    }, {});
    
    // Sorter etasjer i logisk rekkefølgje:
    const floorOrder = ['Kjeller', 'Underetasje', 'Bakkeplan', '1. etasje', '2. etasje', '3. etasje', '4. etasje', '5. etasje', '6. etasje', '7. etasje', '8. etasje', '9. etasje', '10. etasje', '11. etasje', '12. etasje', 'Andre'];
    
    return floorOrder.reduce((acc, floor) => {
      if (grouped[floor]) {
        // Sorter leiligheiter innanfor kvar etasje:
        acc[floor] = grouped[floor].sort((a, b) => a.adresse.localeCompare(b.adresse));
      }
      return acc;
    }, {});
  };

  return (
    <div
      style={{
        maxHeight: '70vh',
        overflowY: 'auto',
        padding: '0',
        background: 'transparent',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        color: '#1e293b',
        borderRadius: '16px',
        border: 'none',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
      }}
      className="popup-container"
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '16px 16px 0 0',
          color: 'white',
          marginBottom: '0',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '-0.025em',
          }}
        >
          {isBlock ? '🏢 Flerbolig' : '🏠 Enebolig'}: {blokkId}
        </h3>
      </div>

      {/* Content area */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '0 0 16px 16px',
          padding: '24px',
        }}
      >
        {isBlock ? (
          // BLOKK-VISNING: Gruppér etter etasje
          (() => {
            const floorGroups = groupByFloor(units);
            return Object.entries(floorGroups).map(([floorName, floorUnits]) => (
              <div key={floorName} style={{ marginBottom: '24px' }}>
                {/* Etasje-header */}
                <div style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#334155',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  📐 {floorName} ({floorUnits.length} {floorUnits.length === 1 ? 'enhet' : 'enheter'})
                </div>
                
                {/* Leiligheiter på denne etasjen */}
                <div style={{ display: 'grid', gap: '12px', paddingLeft: '8px' }}>
                  {floorUnits.map((unit) => (
                    <div
                      key={unit.id}
                      style={{
                        padding: '16px 20px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.03)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        📍 {unit.adresse}
                      </p>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                        }}
                      >
                        {['Ja', 'Nei', 'Ikke hjemme'].map((statusOption) => {
                          const isSelected = unit.status === statusOption;
                          const colors = singleUnitColors;
                          return (
                            <button
                              key={statusOption}
                              onClick={() => {
                                const newStat = isSelected ? 'Ubehandlet' : statusOption;
                                handleStatusUpdate(blokkId, unit.id, newStat);
                              }}
                              style={{
                                padding: '12px 8px',
                                outline: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: isSelected
                                  ? colors[statusOption].fill
                                  : '#ffffff',
                                color: isSelected ? 'white' : '#475569',
                                border: isSelected
                                  ? `2px solid ${colors[statusOption].border}`
                                  : '2px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                userSelect: 'none',
                                textAlign: 'center',
                                boxShadow: isSelected
                                  ? `0 4px 12px ${colors[statusOption].fill}40`
                                  : '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
                                minHeight: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.target.style.backgroundColor = '#f8fafc';
                                  e.target.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.target.style.backgroundColor = '#ffffff';
                                  e.target.style.transform = 'translateY(0)';
                                }
                              }}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
        ) : (
          // ENEBOLIG-VISNING: Original layout
          units.map((unit, i) => (
            <div
              key={unit.id}
              style={{
                marginBottom: i !== units.length - 1 ? 24 : 0,
                padding: '20px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📍 {unit.adresse}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                }}
              >
                {['Ja', 'Nei', 'Ikke hjemme'].map((statusOption) => {
                  const isSelected = unit.status === statusOption;
                  const colors = singleUnitColors;
                  return (
                    <button
                      key={statusOption}
                      onClick={() => {
                        const newStat = isSelected ? 'Ubehandlet' : statusOption;
                        handleStatusUpdate(blokkId, unit.id, newStat);
                      }}
                      style={{
                        padding: '16px 12px',
                        outline: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        backgroundColor: isSelected
                          ? colors[statusOption].fill
                          : '#ffffff',
                        color: isSelected ? 'white' : '#475569',
                        border: isSelected
                          ? `2px solid ${colors[statusOption].border}`
                          : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        userSelect: 'none',
                        textAlign: 'center',
                        boxShadow: isSelected
                          ? `0 4px 12px ${colors[statusOption].fill}40`
                          : '0 1px 2px rgba(215, 9, 9, 0.05)',
                        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = '#f8fafc';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {statusOption}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
