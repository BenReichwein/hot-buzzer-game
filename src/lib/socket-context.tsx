"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import type {
  GameState,
  ServerToClientEvents,
  ClientToServerEvents,
  UserRole,
} from "./types";

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  gameState: GameState | null;
  roomCode: string | null;
  userId: string | null;
  userRole: UserRole | null;
  nickname: string | null;
  roomError: string | null;
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  joinAsPlayer: (id: string, nickname: string) => void;
  joinAsSpectator: () => void;
  startGame: () => void;
  openBuzzers: () => void;
  buzz: () => void;
  awardPoint: (playerId: string) => void;
  nextRound: () => void;
  isQuestioner: boolean;
  questionerName: string | null;
  getPlayerById: (id: string) => { nickname: string } | undefined;
  sortedLeaderboard: Array<{ id: string; nickname: string; score: number }>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io({
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to server");
      setIsConnected(true);
      // Set socket after connection is established
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("game-state", (state) => {
      console.log("📊 Game state updated:", state);
      setGameState(state);
      if (state.roomCode) {
        setRoomCode(state.roomCode);
      }
    });

    newSocket.on("room-created", (code) => {
      console.log("🏠 Room created:", code);
      setRoomCode(code);
      setRoomError(null);
      // Store in localStorage
      localStorage.setItem("buzzer-room-code", code);
    });

    newSocket.on("room-not-found", (code) => {
      console.log("❌ Room not found:", code);
      setRoomError(`Room "${code}" not found`);
    });

    newSocket.on("error", (message) => {
      console.error("⚠️ Server error:", message);
    });

    // Set socket immediately for use in callbacks
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Create a new room
  const createRoom = useCallback(() => {
    if (!socket) return;
    setRoomError(null);
    socket.emit("create-room");
  }, [socket]);

  // Join an existing room
  const joinRoom = useCallback(
    (code: string) => {
      if (!socket) return;
      setRoomError(null);
      socket.emit("join-room", code.toUpperCase());
    },
    [socket]
  );

  // Join as a player
  const joinAsPlayer = useCallback(
    (id: string, playerNickname: string) => {
      if (!socket || !roomCode) return;
      setUserId(id);
      setNickname(playerNickname);
      setUserRole("player");
      socket.emit("join-game", { id, nickname: playerNickname, roomCode });
    },
    [socket, roomCode]
  );

  // Join as spectator
  const joinAsSpectator = useCallback(() => {
    if (!socket || !roomCode) return;
    setUserRole("spectator");
    socket.emit("join-spectator", roomCode);
  }, [socket, roomCode]);

  // Start the game
  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit("start-game");
  }, [socket]);

  // Open buzzers (questioner only)
  const openBuzzers = useCallback(() => {
    if (!socket) return;
    socket.emit("open-buzzers");
  }, [socket]);

  // Buzz in
  const buzz = useCallback(() => {
    if (!socket || !userId) return;
    socket.emit("buzz", userId);
  }, [socket, userId]);

  // Award point to player
  const awardPoint = useCallback(
    (playerId: string) => {
      if (!socket) return;
      socket.emit("award-point", playerId);
    },
    [socket]
  );

  // Next round
  const nextRound = useCallback(() => {
    if (!socket) return;
    socket.emit("next-round");
  }, [socket]);

  // Check if current user is the questioner
  const isQuestioner =
    userId !== null &&
    gameState !== null &&
    gameState.players.length > 0 &&
    gameState.players[gameState.questionerIndex % gameState.players.length]
      ?.id === userId;

  // Get questioner name
  const questionerName =
    gameState && gameState.players.length > 0
      ? gameState.players[gameState.questionerIndex % gameState.players.length]
          ?.nickname || null
      : null;

  // Get player by ID
  const getPlayerById = useCallback(
    (id: string) => {
      return gameState?.players.find((p) => p.id === id);
    },
    [gameState]
  );

  // Sorted leaderboard
  const sortedLeaderboard = gameState
    ? gameState.players
        .map((p) => ({
          id: p.id,
          nickname: p.nickname,
          score: gameState.scores[p.id] || 0,
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  const value: SocketContextType = {
    socket,
    isConnected,
    gameState,
    roomCode,
    userId,
    userRole,
    nickname,
    roomError,
    createRoom,
    joinRoom,
    joinAsPlayer,
    joinAsSpectator,
    startGame,
    openBuzzers,
    buzz,
    awardPoint,
    nextRound,
    isQuestioner,
    questionerName,
    getPlayerById,
    sortedLeaderboard,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
