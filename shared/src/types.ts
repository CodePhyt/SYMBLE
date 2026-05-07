// Core game types for Symble

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
}

export interface CardData {
  id: number;
  symbols: number[];
}

export type GameStateStatus = 'LOBBY' | 'STARTING' | 'PLAYING' | 'FINISHED';

export interface RoomState {
  status: GameStateStatus;
  players: Record<string, Player>;
  centerDeck: CardData[];
  playerDecks: Record<string, CardData[]>;
  currentCenterCard: CardData | null;
  roundWinner: string | null;
}

export interface MatchAttemptPayload {
  playerId: string;
  symbolId: number;
}
