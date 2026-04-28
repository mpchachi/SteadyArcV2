"use client";

import React, { createContext, useContext, MutableRefObject } from 'react';
import type { GazeSample } from '@/lib/gazeMetrics';

interface GameEngineContextType {
  gazeSamples: MutableRefObject<GazeSample[]>;
}

const GameEngineContext = createContext<GameEngineContextType | null>(null);

export function GameEngineProvider({ 
  children, 
  gazeSamples 
}: { 
  children: React.ReactNode;
  gazeSamples: MutableRefObject<GazeSample[]>;
}) {
  return (
    <GameEngineContext.Provider value={{ gazeSamples }}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine() {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new Error('useGameEngine must be used within a GameEngineProvider');
  }
  return context;
}
