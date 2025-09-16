// components/SuccessAnimation.jsx
import React from 'react';

export function SuccessAnimation({ explosion, isMobile, onComplete }) {
  if (!explosion) return null;

  return (
    <>
      {/* Ring 1 */}
      <div style={{
        position: 'fixed', // Changed from absolute to fixed for better mobile positioning
        top: explosion.y + 'px',
        left: explosion.x + 'px',
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

      {/* Ring 2 */}
      <div style={{
        position: 'fixed',
        top: explosion.y + 'px',
        left: explosion.x + 'px',
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

      {/* Ring 3 */}
      <div style={{
        position: 'fixed',
        top: explosion.y + 'px',
        left: explosion.x + 'px',
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

      {/* Center Emoticon */}
      <div style={{
        position: 'fixed',
        top: explosion.y + 'px',
        left: explosion.x + 'px',
        transform: 'translate(-50%, -50%)',
        fontSize: isMobile ? '2.5rem' : '3rem',
        animation: 'centerPulse 1.5s ease-out forwards',
        zIndex: 10000,
        pointerEvents: 'none'
      }}>
        🤩
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes ringExplosion {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            width: ${isMobile ? '300px' : '500px'};
            height: ${isMobile ? '300px' : '500px'};
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
            transform: translate(-50%, -50%) scale(1.3);
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
    </>
  );
}
