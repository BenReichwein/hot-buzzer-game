"use client";

import { useSocket } from "@/lib/socket-context";

export function QuestionerView() {
  const {
    gameState,
    openBuzzers,
    awardPoint,
    nextRound,
    isQuestioner,
    getPlayerById,
  } = useSocket();

  if (!gameState || !isQuestioner) {
    return null;
  }

  const roundWinner = gameState.roundWinner
    ? getPlayerById(gameState.roundWinner)
    : null;

  // Verbal phase - ask question and open buzzers
  if (gameState.phase === "verbal") {
    return (
      <div className="min-h-screen bg-linear-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎤</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            You&apos;re the Questioner!
          </h2>
          <p className="text-xl text-purple-300 mb-8">
            Ask your question out loud, then open the buzzers.
          </p>

          <button
            onClick={openBuzzers}
            className="w-full py-6 px-8 bg-linear-to-r from-yellow-500 to-orange-500 
                     hover:from-yellow-400 hover:to-orange-400 
                     text-white text-2xl font-bold rounded-2xl 
                     transform transition-all hover:scale-105 active:scale-95
                     shadow-lg shadow-orange-500/30"
          >
            🔔 Open Buzzers!
          </button>
        </div>
      </div>
    );
  }

  // Buzzing or Decision phase - show buzz order and award buttons
  if (gameState.phase === "buzzing" || gameState.phase === "decision") {
    const buzzOrder = gameState.buzzOrder;

    return (
      <div className="min-h-screen bg-linear-to-b from-purple-900 to-indigo-900 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {buzzOrder.length === 0 ? "Buzzers Open!" : "Pick the Winner!"}
            </h2>
            <p className="text-purple-300">
              {buzzOrder.length === 0
                ? "Waiting for players to buzz..."
                : "Tap the player who got it right"}
            </p>
          </div>

          {/* Buzz Order */}
          {buzzOrder.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-8xl animate-pulse">🔔</div>
            </div>
          ) : (
            <ul className="space-y-3">
              {buzzOrder.map((playerId, index) => {
                const player = getPlayerById(playerId);
                return (
                  <li key={playerId}>
                    <button
                      onClick={() => awardPoint(playerId)}
                      className={`w-full p-4 rounded-xl flex items-center gap-4
                                transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                ${
                                  index === 0
                                    ? "bg-linear-to-r from-yellow-500 to-orange-500 text-white"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                    >
                      <span className="text-3xl">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                      </span>
                      <span className="text-xl font-bold flex-1 text-left">
                        {player?.nickname || "Unknown"}
                      </span>
                      <span className="text-lg">✓ Award</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Waiting players count */}
          <div className="mt-6 text-center text-purple-300">
            {gameState.players.length - 1 - buzzOrder.length} players
            haven&apos;t buzzed
          </div>
        </div>
      </div>
    );
  }

  // Award phase - show winner and next round button
  if (gameState.phase === "award") {
    return (
      <div className="min-h-screen bg-linear-to-b from-yellow-700 to-orange-800 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Point Awarded!</h2>
          <p className="text-4xl font-black text-yellow-200 mb-8">
            {roundWinner?.nickname}
          </p>

          <button
            onClick={nextRound}
            className="w-full py-6 px-8 bg-linear-to-r from-green-500 to-emerald-600 
                     hover:from-green-400 hover:to-emerald-500 
                     text-white text-2xl font-bold rounded-2xl 
                     transform transition-all hover:scale-105 active:scale-95
                     shadow-lg shadow-green-500/30"
          >
            ➡️ Next Round
          </button>
        </div>
      </div>
    );
  }

  return null;
}
