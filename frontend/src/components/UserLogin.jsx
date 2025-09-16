import React, { useState } from 'react';

export function UserLogin({ onUserSet, currentUser }) {
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsRegistering(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          email: '' 
        })
      });

      const data = await response.json();
      if (data.user) {
        onUserSet(data.user);
        console.log('✅ Brukar registrert:', data.user);
      }
    } catch (error) {
      console.error('Feil ved registrering:', error);
      alert('Kunne ikkje registrere brukar');
    } finally {
      setIsRegistering(false);
    }
  };

  // INNLOGGA BRUKAR - sentert og elegant
  if (currentUser) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(34, 197, 94, 0.95)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '12px',
        zIndex: 1000,
        fontFamily: 'system-ui',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span>👤 {currentUser.name}</span>
        <button 
          onClick={() => onUserSet(null)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Logg ut
        </button>
      </div>
    );
  }

  // INNLOGGINGSSKJEMA - sentert og større
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '25px 30px',
      borderRadius: '12px',
      zIndex: 1000,
      fontFamily: 'system-ui',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      minWidth: '300px',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
        🗳️ Vervekart
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Ditt namn:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skriv namnet ditt"
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              width: '100%',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
            disabled={isRegistering}
          />
        </div>
        <button 
          type="submit"
          disabled={isRegistering || !name.trim()}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%',
            opacity: (isRegistering || !name.trim()) ? 0.6 : 1
          }}
        >
          {isRegistering ? '⏳ Registrerer...' : '🚀 Start verving'}
        </button>
      </form>
    </div>
  );
}
