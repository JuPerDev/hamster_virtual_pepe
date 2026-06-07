import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HamsterState, Stats, ActionType } from '../types';

const INITIAL_STATE: HamsterState = {
  name: 'Bolita',
  stats: {
    hunger: 80,
    happiness: 70,
    energy: 90,
    cleanliness: 85,
  },
  mood: 'Feliz',
  isSpeaking: false,
  isSoundOn: true,
  currentAction: null,
  birthTime: Date.now(),
  lastUpdate: Date.now(),
  positionX: 0,
  facingDirection: 1,
  isWalking: false,
};

export function useHamsterState() {
  const [state, setState] = useState<HamsterState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem('hamster_pet_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Calcular decadencia
        const minutesAway = (Date.now() - (parsed.lastUpdate || Date.now())) / 60000;
        let decayStats = { ...parsed.stats };
        
        if (minutesAway > 1) {
          const decay = Math.min(minutesAway * 0.5, 40);
          decayStats.hunger = Math.max(0, decayStats.hunger - decay);
          decayStats.energy = Math.max(0, decayStats.energy - decay * 0.3);
          decayStats.cleanliness = Math.max(0, decayStats.cleanliness - decay * 0.2);
          decayStats.happiness = Math.max(0, decayStats.happiness - decay * 0.4);
        }

        setState(prev => ({
          ...prev,
          ...parsed,
          stats: decayStats,
          currentAction: null,
          isWalking: false,
        }));
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveState = async (newState: HamsterState) => {
    try {
      const toSave = {
        ...newState,
        lastUpdate: Date.now()
      };
      await AsyncStorage.setItem('hamster_pet_state', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  };

  const updateState = useCallback((updates: Partial<HamsterState> | ((prev: HamsterState) => Partial<HamsterState>)) => {
    setState(prev => {
      const newValues = typeof updates === 'function' ? updates(prev) : updates;
      const nextState = { ...prev, ...newValues };
      
      // Update Mood
      const { hunger, happiness, energy, cleanliness } = nextState.stats;
      const avg = (hunger + happiness + energy + cleanliness) / 4;
      
      let mood = 'Normal';
      if (nextState.currentAction === 'sleeping') mood = 'Durmiendo';
      else if (hunger < 20) mood = 'Hambriento';
      else if (energy < 20) mood = 'Cansado';
      else if (cleanliness < 20) mood = 'Sucio';
      else if (avg > 75) mood = 'Feliz';
      else if (avg > 25) mood = 'Triste';
      else mood = 'Mal';
      
      nextState.mood = mood;
      
      saveState(nextState);
      return nextState;
    });
  }, []);

  const updateStats = useCallback((statUpdates: Partial<Stats>) => {
    updateState(prev => ({
      stats: {
        hunger: Math.max(0, Math.min(100, prev.stats.hunger + (statUpdates.hunger || 0))),
        happiness: Math.max(0, Math.min(100, prev.stats.happiness + (statUpdates.happiness || 0))),
        energy: Math.max(0, Math.min(100, prev.stats.energy + (statUpdates.energy || 0))),
        cleanliness: Math.max(0, Math.min(100, prev.stats.cleanliness + (statUpdates.cleanliness || 0))),
      }
    }));
  }, [updateState]);

  // Tick timer
  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.currentAction === 'sleeping') return prev;
        
        const nextStats = {
          hunger: Math.max(0, prev.stats.hunger - 0.15),
          happiness: Math.max(0, prev.stats.happiness - 0.08),
          energy: Math.max(0, prev.stats.energy - 0.05),
          cleanliness: Math.max(0, prev.stats.cleanliness - 0.04),
        };
        
        let newAction = prev.currentAction;
        if (!newAction && nextStats.energy < 15) {
          newAction = 'sleeping';
        } else if (newAction === 'sleeping' && prev.currentAction !== 'sleeping') {
           newAction = null; // Wake up manually or naturally
        }
        
        const nextState = { ...prev, stats: nextStats, currentAction: newAction };
        saveState(nextState);
        return nextState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  return { state, updateState, updateStats, isLoaded };
}
