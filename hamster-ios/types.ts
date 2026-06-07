export interface Stats {
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
}

export type ActionType = 'idle' | 'walking' | 'eating' | 'sleeping' | 'cleaning' | 'petted' | 'happy' | 'bounce' | 'catching';

export interface HamsterState {
  name: string;
  stats: Stats;
  mood: string;
  isSpeaking: boolean;
  isSoundOn: boolean;
  currentAction: ActionType | null;
  birthTime: number;
  lastUpdate: number;
  positionX: number;
  facingDirection: number;
  isWalking: boolean;
}
