"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SocketProvider, useSocket } from "@/lib/socket-context";
import { Lobby } from "@/components/Lobby";
import { PlayerView } from "@/components/PlayerView";
import { QuestionerView } from "@/components/QuestionerView";
import { SpectatorView } from "@/components/SpectatorView";

function GameContent() {
  const router = useRouter();
  const {
    gameState,
    userRole,
    isQuestioner,
    joinAsPlayer,
    joinAsSpectator,
    createRoom,
    joinRoom,
    roomCode,
    roomError,
    isConnected,
  } = useSocket();

  // Track setup state
  const [hasSetupRoom, setHasSetupRoom] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Handle room creation/joining
  useEffect(() => {
    if (!isConnected || hasSetupRoom) return;

    const storedRole = localStorage.getItem("buzzer-role");
    const storedRoomAction = localStorage.getItem("buzzer-room-action");
    const storedRoomCode = localStorage.getItem("buzzer-room-code");

    if (!storedRole) {
      router.push("/");
      return;
    }

    // Create or join room (only once)
    setHasSetupRoom(true);
    if (storedRoomAction === "create") {
      createRoom();
    } else if (storedRoomAction === "join" && storedRoomCode) {
      joinRoom(storedRoomCode);
    } else {
      router.push("/");
    }
  }, [isConnected, hasSetupRoom, createRoom, joinRoom, router]);

  // Handle player/spectator join after room is ready
  useEffect(() => {
    if (!roomCode || hasJoined) return;

    const storedRole = localStorage.getItem("buzzer-role");
    const storedNickname = localStorage.getItem("buzzer-nickname");
    const storedId = localStorage.getItem("buzzer-user-id");

    setHasJoined(true);
    if (storedRole === "spectator") {
      joinAsSpectator();
    } else if (storedRole === "player" && storedNickname && storedId) {
      joinAsPlayer(storedId, storedNickname);
    } else {
      router.push("/");
    }
  }, [roomCode, hasJoined, joinAsPlayer, joinAsSpectator, router]);

  // Handle room error
  useEffect(() => {
    if (roomError) {
      // Clear stored room code and redirect
      localStorage.removeItem("buzzer-room-code");
      const timeout = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [roomError, router]);

  // Show error if room not found
  if (roomError) {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-900 to-green-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-2xl mb-2">Room Not Found</div>
          <div className="text-red-300">{roomError}</div>
          <div className="text-gray-400 mt-4">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!gameState || !hasJoined) {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-900 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎄</div>
          <div className="text-white text-2xl animate-pulse">
            {!roomCode ? "Setting up room..." : "Joining game..."}
          </div>
          {roomCode && (
            <div className="mt-4 text-yellow-400 text-3xl font-bold">
              Room: {roomCode}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Spectator mode
  if (userRole === "spectator") {
    if (gameState.phase === "lobby") {
      return <Lobby />;
    }
    return <SpectatorView />;
  }

  // Player mode
  if (userRole === "player") {
    // Show lobby before game starts
    if (!gameState.isStarted) {
      return <Lobby />;
    }

    // Questioner view
    if (isQuestioner) {
      return <QuestionerView />;
    }

    // Regular player view
    return <PlayerView />;
  }

  // This shouldn't happen, but just in case
  return (
    <div className="min-h-screen bg-linear-to-b from-red-900 to-green-900 flex items-center justify-center">
      <div className="text-white text-2xl">
        Something went wrong. Please refresh.
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <SocketProvider>
      <GameContent />
    </SocketProvider>
  );
}
