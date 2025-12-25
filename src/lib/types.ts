// Shared types for the Christmas Hot Buzzer game

export interface Player {
  id: string;           // UUID
  socketId: string;     // Socket.io connection ID
  nickname: string;
  isConnected: boolean;
}

export interface GameState {
  roomCode: string;                  // Room code for this game
  players: Player[];
  scores: Record<string, number>;    // UUID -> score
  currentRound: number;
  questionerIndex: number;           // Index in players array for Round Robin
  phase: GamePhase;
  buzzOrder: string[];               // UUIDs in order of buzzing
  roundWinner: string | null;        // UUID of round winner
  isStarted: boolean;
}

export type GamePhase =
  | 'lobby'      // Waiting for players
  | 'verbal'     // Questioner asking question verbally
  | 'buzzing'    // Buzzers are open
  | 'decision'   // Questioner deciding who answered correctly
  | 'award';     // Showing round winner

export type UserRole = 'player' | 'spectator';

// Socket.io Event Types
export interface ServerToClientEvents {
  'game-state': (state: GameState) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'buzz-registered': (playerId: string, position: number) => void;
  'round-winner': (playerId: string, playerName: string) => void;
  'room-created': (roomCode: string) => void;
  'room-not-found': (roomCode: string) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'create-room': () => void;
  'join-room': (roomCode: string) => void;
  'join-game': (data: { id: string; nickname: string; roomCode: string }) => void;
  'join-spectator': (roomCode: string) => void;
  'start-game': () => void;
  'open-buzzers': () => void;
  'buzz': (playerId: string) => void;
  'award-point': (playerId: string) => void;
  'next-round': () => void;
  'request-state': () => void;
}

// Create a fresh game state for a room
export function createGameState(roomCode: string): GameState {
  return {
    roomCode,
    players: [],
    scores: {},
    currentRound: 0,
    questionerIndex: 0,
    phase: 'lobby',
    buzzOrder: [],
    roundWinner: null,
    isStarted: false,
  };
}
