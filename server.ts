import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  GameState,
  Player,
  ServerToClientEvents,
  ClientToServerEvents,
} from './src/lib/types';
import { createGameState } from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Room management
const rooms = new Map<string, GameState>();
const socketToRoom = new Map<string, string>(); // socketId -> roomCode

// Christmas-themed room code words
const ROOM_WORDS = [
  'SANTA', 'RUDOLPH', 'FROSTY', 'SNOWMAN', 'JINGLE', 'BELLS', 'HOLLY',
  'NOEL', 'CANDY', 'TINSEL', 'STAR', 'ANGEL', 'SLEIGH', 'GIFT', 'MERRY',
  'JOLLY', 'WINTER', 'CLAUS', 'DASHER', 'DANCER', 'PRANCER', 'VIXEN',
  'COMET', 'CUPID', 'DONNER', 'BLITZEN', 'NUTCRACKER', 'MISTLETOE'
];

function generateRoomCode(): string {
  // Pick a random word and add 2 random digits
  const word = ROOM_WORDS[Math.floor(Math.random() * ROOM_WORDS.length)];
  const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const code = `${word}${num}`;

  // Ensure uniqueness
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function getRoom(socketId: string): GameState | undefined {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) return undefined;
  return rooms.get(roomCode);
}

function getQuestioner(gameState: GameState): Player | undefined {
  if (gameState.players.length === 0) return undefined;
  return gameState.players[gameState.questionerIndex % gameState.players.length];
}

function broadcastToRoom(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>,
  roomCode: string,
  gameState: GameState
) {
  io.to(roomCode).emit('game-state', gameState);
}

function resetForNewRound(gameState: GameState) {
  gameState.buzzOrder = [];
  gameState.roundWinner = null;
  gameState.phase = 'verbal';
}

function rotateQuestioner(gameState: GameState) {
  if (gameState.players.length > 0) {
    gameState.questionerIndex = (gameState.questionerIndex + 1) % gameState.players.length;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Create a new room
    socket.on('create-room', () => {
      const roomCode = generateRoomCode();
      const gameState = createGameState(roomCode);
      rooms.set(roomCode, gameState);

      socket.join(roomCode);
      socketToRoom.set(socket.id, roomCode);

      console.log(`🏠 Room created: ${roomCode}`);
      socket.emit('room-created', roomCode);
      socket.emit('game-state', gameState);
    });

    // Join existing room
    socket.on('join-room', (roomCode: string) => {
      const upperCode = roomCode.toUpperCase();
      const gameState = rooms.get(upperCode);

      if (!gameState) {
        console.log(`❌ Room not found: ${upperCode}`);
        socket.emit('room-not-found', upperCode);
        return;
      }

      socket.join(upperCode);
      socketToRoom.set(socket.id, upperCode);

      console.log(`🚪 Client joined room: ${upperCode}`);
      socket.emit('game-state', gameState);
    });

    // Player joins the game
    socket.on('join-game', ({ id, nickname, roomCode }) => {
      const upperCode = roomCode.toUpperCase();
      const gameState = rooms.get(upperCode);

      if (!gameState) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Make sure socket is in the room
      socket.join(upperCode);
      socketToRoom.set(socket.id, upperCode);

      console.log(`🎮 Player joining room ${upperCode}: ${nickname} (${id})`);

      // Check if player already exists (reconnection)
      const existingPlayer = gameState.players.find((p) => p.id === id);

      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.nickname = nickname;
        existingPlayer.isConnected = true;
        console.log(`♻️ Player reconnected: ${nickname}`);
      } else {
        const newPlayer: Player = {
          id,
          socketId: socket.id,
          nickname,
          isConnected: true,
        };
        gameState.players.push(newPlayer);
        gameState.scores[id] = 0;
        console.log(`✨ New player added: ${nickname}`);
      }

      broadcastToRoom(io, upperCode, gameState);
    });

    // Spectator joins
    socket.on('join-spectator', (roomCode: string) => {
      const upperCode = roomCode.toUpperCase();
      const gameState = rooms.get(upperCode);

      if (!gameState) {
        socket.emit('room-not-found', upperCode);
        return;
      }

      socket.join(upperCode);
      socketToRoom.set(socket.id, upperCode);

      console.log(`📺 Spectator joined room ${upperCode}: ${socket.id}`);
      socket.emit('game-state', gameState);
    });

    // Start the game
    socket.on('start-game', () => {
      const gameState = getRoom(socket.id);
      if (!gameState) {
        socket.emit('error', 'Not in a room');
        return;
      }

      if (gameState.players.length < 2) {
        socket.emit('error', 'Need at least 2 players to start');
        return;
      }

      console.log(`🎬 Game starting in room ${gameState.roomCode} with ${gameState.players.length} players`);
      gameState.isStarted = true;
      gameState.currentRound = 1;
      gameState.questionerIndex = 0;
      gameState.phase = 'verbal';
      gameState.buzzOrder = [];
      gameState.roundWinner = null;

      broadcastToRoom(io, gameState.roomCode, gameState);
    });

    // Questioner opens buzzers
    socket.on('open-buzzers', () => {
      const gameState = getRoom(socket.id);
      if (!gameState) return;

      const questioner = getQuestioner(gameState);
      if (!questioner || questioner.socketId !== socket.id) {
        socket.emit('error', 'Only the questioner can open buzzers');
        return;
      }

      console.log(`🔔 Buzzers opened in room ${gameState.roomCode} by ${questioner.nickname}`);
      gameState.phase = 'buzzing';
      gameState.buzzOrder = [];
      broadcastToRoom(io, gameState.roomCode, gameState);
    });

    // Player buzzes in
    socket.on('buzz', (playerId) => {
      const gameState = getRoom(socket.id);
      if (!gameState) return;

      if (gameState.phase !== 'buzzing') {
        socket.emit('error', 'Buzzers are not open');
        return;
      }

      // Prevent duplicate buzzes
      if (gameState.buzzOrder.includes(playerId)) {
        return;
      }

      // Don't allow questioner to buzz
      const questioner = getQuestioner(gameState);
      if (questioner?.id === playerId) {
        return;
      }

      const player = gameState.players.find((p) => p.id === playerId);
      if (!player) return;

      console.log(`🐝 BUZZ in room ${gameState.roomCode} from ${player.nickname} (position ${gameState.buzzOrder.length + 1})`);
      gameState.buzzOrder.push(playerId);

      // Move to decision phase after first buzz
      if (gameState.buzzOrder.length === 1) {
        gameState.phase = 'decision';
      }

      // Notify all clients in the room about the buzz
      io.to(gameState.roomCode).emit('buzz-registered', playerId, gameState.buzzOrder.length);
      broadcastToRoom(io, gameState.roomCode, gameState);
    });

    // Questioner awards point to a player
    socket.on('award-point', (playerId) => {
      const gameState = getRoom(socket.id);
      if (!gameState) return;

      const questioner = getQuestioner(gameState);
      if (!questioner || questioner.socketId !== socket.id) {
        socket.emit('error', 'Only the questioner can award points');
        return;
      }

      const player = gameState.players.find((p) => p.id === playerId);
      if (!player) {
        socket.emit('error', 'Player not found');
        return;
      }

      console.log(`🏆 Point awarded in room ${gameState.roomCode} to ${player.nickname}`);
      gameState.scores[playerId] = (gameState.scores[playerId] || 0) + 1;
      gameState.roundWinner = playerId;
      gameState.phase = 'award';

      io.to(gameState.roomCode).emit('round-winner', playerId, player.nickname);
      broadcastToRoom(io, gameState.roomCode, gameState);
    });

    // Move to next round
    socket.on('next-round', () => {
      const gameState = getRoom(socket.id);
      if (!gameState) return;

      const questioner = getQuestioner(gameState);
      if (!questioner || questioner.socketId !== socket.id) {
        socket.emit('error', 'Only the questioner can start the next round');
        return;
      }

      console.log(`➡️ Room ${gameState.roomCode} moving to round ${gameState.currentRound + 1}`);
      rotateQuestioner(gameState);
      gameState.currentRound += 1;
      resetForNewRound(gameState);

      broadcastToRoom(io, gameState.roomCode, gameState);
    });

    // Request current state (for reconnection)
    socket.on('request-state', () => {
      const gameState = getRoom(socket.id);
      if (gameState) {
        socket.emit('game-state', gameState);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      const gameState = getRoom(socket.id);
      if (gameState) {
        // Mark player as disconnected but keep in game
        const player = gameState.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.isConnected = false;
          console.log(`👋 Player ${player.nickname} disconnected from room ${gameState.roomCode}`);
          broadcastToRoom(io, gameState.roomCode, gameState);
        }
      }

      // Clean up socket-to-room mapping
      socketToRoom.delete(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`
🎄 Christmas Hot Buzzer Server Running! 🎄
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Local:    http://${hostname}:${port}
📱 Network:  Check your IP for mobile devices
🏠 Rooms:    Create or join with room codes!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
});
