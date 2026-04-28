"use client";

import React, { useEffect, useState } from 'react';

interface ChallengeCardProps {
  type: 'REPEATED_PINCH' | 'HOLD_HAND_OPEN' | 'SMILE_CHALLENGE';
  instruction: string;
  progress: number;        // 0-100 para retos de mantener
  count?: number;          // actual para retos de repetición
  targetCount?: number;    // objetivo para retos de repetición
  visible: boolean;
}

export default function ChallengeCard({
  type,
  instruction,
  progress,
  count = 0,
  targetCount = 4,
  visible
}: ChallengeCardProps) {
  const [prevCount, setPrevCount] = useState(count);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (count > prevCount && type === 'REPEATED_PINCH') {
      setAnimatingIdx(count - 1);
      const timer = setTimeout(() => setAnimatingIdx(null), 200);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount, type]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'REPEATED_PINCH': return '🤌';
      case 'HOLD_HAND_OPEN': return '🖐';
      case 'SMILE_CHALLENGE': return '😊';
      default: return '';
    }
  };

  const getTypeName = () => {
    switch (type) {
      case 'REPEATED_PINCH': return 'PINCH';
      case 'HOLD_HAND_OPEN': return 'MANO';
      case 'SMILE_CHALLENGE': return 'SONRISA';
      default: return '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '420px',
      backgroundColor: 'rgba(10, 20, 40, 0.92)',
      border: '3px solid #00ff88',
      borderRadius: '8px',
      padding: '20px 28px',
      boxShadow: '0 0 20px rgba(0,255,136,0.3)',
      fontFamily: '"Press Start 2P", cursive',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'white',
      pointerEvents: 'none'
    }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.5rem', color: '#888' }}>{getTypeName()}</span>
        <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
      </div>

      <div style={{ margin: '12px 0', fontSize: '0.75rem', textAlign: 'center' }}>
        {instruction}
      </div>

      {type === 'REPEATED_PINCH' ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          {Array.from({ length: targetCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '32px',
                height: '32px',
                border: '2px solid #00ff88',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: i < count ? '#00ff88' : 'transparent',
                transition: 'background-color 0.1s',
                transform: animatingIdx === i ? 'scale(1.3)' : 'scale(1)',
                animation: animatingIdx === i ? 'pixel-pop 0.2s ease-out' : 'none'
              }}
            >
              {i < count && <span style={{ color: '#0a1428', fontWeight: 'bold' }}>✓</span>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '0.5rem', marginBottom: '4px', textAlign: 'right', color: '#00ff88' }}>
            {Math.round(progress)}%
          </div>
          <div style={{
            height: '8px',
            width: '100%',
            backgroundColor: '#1a3a2a',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#00ff88',
              transition: 'width 0.1s linear'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
