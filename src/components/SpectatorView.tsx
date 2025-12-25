"use client";

import { useSocket } from "@/lib/socket-context";

export function SpectatorView() {
  const {
    gameState,
    questionerName,
    getPlayerById,
    sortedLeaderboard,
    roomCode,
  } = useSocket();

  if (!gameState) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-4xl animate-pulse">Connecting...</div>
      </div>
    );
  }

  const roundWinner = gameState.roundWinner
    ? getPlayerById(gameState.roundWinner)
    : null;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-red-950 to-green-950 p-8 overflow-hidden">
      {/* Decorative corners */}
      <div className="fixed top-0 left-0 text-8xl opacity-30">🎄</div>
      <div className="fixed top-0 right-0 text-8xl opacity-30">🎄</div>
      <div className="fixed bottom-0 left-0 text-8xl opacity-30">🎁</div>
      <div className="fixed bottom-0 right-0 text-8xl opacity-30">🎁</div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg">
            🎄 Christmas Hot Buzzer 🔔
          </h1>
          {roomCode && (
            <p className="text-2xl text-yellow-400 font-bold">
              Room: {roomCode}
            </p>
          )}
          {gameState.isStarted && (
            <p className="text-3xl text-green-400 mt-2">
              Round {gameState.currentRound}
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Panel */}
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/10">
            {/* Lobby */}
            {gameState.phase === "lobby" && (
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Waiting for Players
                </h2>
                <div className="text-8xl animate-bounce mb-4">👥</div>
                <p className="text-3xl text-gray-300">
                  {gameState.players.length} players connected
                </p>
              </div>
            )}

            {/* Verbal Phase */}
            {gameState.phase === "verbal" && (
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Question Time!
                </h2>
                <div className="text-8xl mb-4">🎤</div>
                <p className="text-5xl font-bold text-yellow-400">
                  {questionerName}
                </p>
                <p className="text-3xl text-gray-300 mt-2">
                  is asking a question...
                </p>
              </div>
            )}

            {/* Buzzing Phase */}
            {gameState.phase === "buzzing" && (
              <div className="text-center">
                <div className="text-9xl animate-pulse">🔔</div>
                <h2 className="text-6xl font-black text-red-500 mt-4 animate-pulse">
                  BUZZERS OPEN!
                </h2>
              </div>
            )}

            {/* Decision Phase - Buzz Order */}
            {gameState.phase === "decision" && (
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Buzz Order
                </h2>
                <ul className="space-y-4">
                  {gameState.buzzOrder.map((playerId, index) => {
                    const player = getPlayerById(playerId);
                    return (
                      <li
                        key={playerId}
                        className={`text-4xl font-bold p-4 rounded-xl ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        <span className="mr-4">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                        </span>
                        {player?.nickname || "Unknown"}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Award Phase */}
            {gameState.phase === "award" && (
              <div className="text-center">
                <div className="text-9xl animate-bounce mb-4">🏆</div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Round Winner!
                </h2>
                <p className="text-6xl font-black text-yellow-400">
                  {roundWinner?.nickname}
                </p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 border-2 border-yellow-500/30">
            <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center flex items-center justify-center gap-3">
              <span>🏆</span>
              <span>LEADERBOARD</span>
              <span>🏆</span>
            </h2>

            {sortedLeaderboard.length === 0 ? (
              <p className="text-3xl text-gray-400 text-center">
                No players yet
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedLeaderboard.map((player, index) => (
                  <li
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-xl text-3xl font-bold
                               ${
                                 index === 0
                                   ? "bg-yellow-500/20 border-2 border-yellow-500"
                                   : index === 1
                                   ? "bg-gray-400/20 border-2 border-gray-400"
                                   : index === 2
                                   ? "bg-orange-700/20 border-2 border-orange-700"
                                   : "bg-white/5"
                               }`}
                  >
                    <span className="w-16 text-center">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}.`}
                    </span>
                    <span className="flex-1 text-white">{player.nickname}</span>
                    <span
                      className={`text-4xl font-black ${
                        index === 0 ? "text-yellow-400" : "text-white"
                      }`}
                    >
                      {player.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
