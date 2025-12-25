"use client";

import { useSocket } from "@/lib/socket-context";

// Pre-generate snowflake positions to avoid Math.random during render
const SNOWFLAKE_COUNT = 50;
const snowflakeStyles = Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 2) % 100}%`,
  animationDelay: `${(i * 0.1) % 5}s`,
  animationDuration: `${5 + ((i * 0.2) % 10)}s`,
}));

export function Lobby() {
  const { gameState, startGame, isConnected, nickname, userRole, roomCode } =
    useSocket();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-red-900 to-green-900">
        <div className="text-white text-2xl animate-pulse">
          Connecting to server...
        </div>
      </div>
    );
  }

  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;

  return (
    <div className="min-h-screen bg-linear-to-b from-red-900 via-red-800 to-green-900 p-6">
      {/* Snow effect */}
      <div className="snow-container fixed inset-0 pointer-events-none overflow-hidden">
        {snowflakeStyles.map((style) => (
          <div
            key={style.id}
            className="snowflake absolute text-white opacity-80"
            style={{
              left: style.left,
              animationDelay: style.animationDelay,
              animationDuration: style.animationDuration,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            🎄 Christmas Hot Buzzer 🎄
          </h1>

          {/* Room Code Display */}
          {roomCode && (
            <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-yellow-500/50">
              <p className="text-sm text-yellow-300 mb-1">Room Code</p>
              <p className="text-4xl font-black text-yellow-400 tracking-wider">
                {roomCode}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Share this code with friends to join!
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-green-300">
              {userRole === "spectator"
                ? "📺 Spectator Mode"
                : `Welcome, ${nickname}!`}
            </p>
            <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${
                isConnected ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {isConnected ? "● Connected" : "○ Disconnected"}
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎮</span>
            <span>Players ({playerCount})</span>
          </h2>

          {playerCount === 0 ? (
            <p className="text-gray-300 text-center py-4">
              Waiting for players to join...
            </p>
          ) : (
            <ul className="space-y-2">
              {gameState.players.map((player, index) => (
                <li
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    player.isConnected
                      ? "bg-green-500/20 border border-green-500/30"
                      : "bg-gray-500/20 border border-gray-500/30"
                  }`}
                >
                  <span className="text-2xl">
                    {index === 0 ? "🎅" : index === 1 ? "🤶" : "🧝"}
                  </span>
                  <span className="text-white font-medium flex-1">
                    {player.nickname}
                  </span>
                  <span
                    className={`text-sm ${
                      player.isConnected ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {player.isConnected ? "Ready" : "Disconnected"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Start Button (only for players when enough are present) */}
        {userRole === "player" && (
          <div className="text-center">
            {canStart ? (
              <button
                onClick={startGame}
                className="w-full py-4 px-8 bg-linear-to-r from-green-500 to-green-600 
                         hover:from-green-400 hover:to-green-500 
                         text-white text-xl font-bold rounded-2xl 
                         transform transition-all hover:scale-105 active:scale-95
                         shadow-lg shadow-green-500/30"
              >
                🎬 Start Game!
              </button>
            ) : (
              <div className="py-4 px-8 bg-gray-600/50 text-gray-300 text-xl rounded-2xl">
                Need at least 2 players to start
              </div>
            )}
          </div>
        )}

        {userRole === "spectator" && (
          <div className="text-center py-4 text-gray-300">
            Waiting for players to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
