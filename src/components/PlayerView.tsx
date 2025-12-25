"use client";

import { useSocket } from "@/lib/socket-context";

export function PlayerView() {
  const { gameState, buzz, questionerName, isQuestioner, userId } = useSocket();

  // Derive state directly (no useMemo needed for simple calculations)
  const hasBuzzed = userId
    ? gameState?.buzzOrder.includes(userId) ?? false
    : false;
  const buzzPosition = (() => {
    if (!userId || !gameState?.buzzOrder) return null;
    const position = gameState.buzzOrder.indexOf(userId);
    return position !== -1 ? position + 1 : null;
  })();

  if (!gameState || isQuestioner) {
    return null;
  }

  const roundWinner = gameState.roundWinner
    ? gameState.players.find((p) => p.id === gameState.roundWinner)
    : null;

  const handleBuzz = () => {
    if (hasBuzzed) return;

    // Vibrate on buzz (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    buzz();
  };

  // Verbal phase - waiting for questioner
  if (gameState.phase === "verbal") {
    return (
      <div className="min-h-screen bg-linear-to-b from-red-900 to-green-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">🎤</div>
          <h2 className="text-3xl font-bold text-white mb-4">Listen Up!</h2>
          <p className="text-xl text-green-300">
            Waiting for{" "}
            <span className="font-bold text-yellow-400">{questionerName}</span>{" "}
            to ask a question...
          </p>
        </div>
      </div>
    );
  }

  // Buzzing phase - show the big buzzer button
  if (gameState.phase === "buzzing" && !hasBuzzed) {
    return (
      <div
        className="min-h-screen bg-linear-to-b from-red-600 to-red-800 flex items-center justify-center p-4 cursor-pointer select-none"
        onClick={handleBuzz}
      >
        <button
          className="w-full h-[80vh] max-w-lg bg-linear-to-b from-red-500 to-red-700 
                     rounded-[4rem] border-8 border-red-400 
                     shadow-[0_15px_0_0_#991b1b,0_20px_30px_rgba(0,0,0,0.4)]
                     active:shadow-[0_5px_0_0_#991b1b,0_10px_20px_rgba(0,0,0,0.4)]
                     active:translate-y-[10px]
                     transition-all duration-75
                     flex flex-col items-center justify-center
                     animate-pulse"
        >
          <span className="text-8xl font-black text-white drop-shadow-lg">
            BUZZ!
          </span>
          <span className="text-2xl text-red-200 mt-4">TAP FAST! 🔔</span>
        </button>
      </div>
    );
  }

  // Decision phase or already buzzed
  if (gameState.phase === "buzzing" || gameState.phase === "decision") {
    return (
      <div className="min-h-screen bg-linear-to-b from-green-800 to-green-900 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          {hasBuzzed ? (
            <>
              <div className="text-8xl mb-6">
                {buzzPosition === 1
                  ? "🥇"
                  : buzzPosition === 2
                  ? "🥈"
                  : buzzPosition === 3
                  ? "🥉"
                  : "✋"}
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">
                You Buzzed!
              </h2>
              <p className="text-6xl font-black text-yellow-400 mb-4">
                #{buzzPosition}
              </p>
              <p className="text-xl text-green-300">
                Waiting for {questionerName} to pick...
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">⏰</div>
              <h2 className="text-3xl font-bold text-white mb-4">Too Late!</h2>
              <p className="text-xl text-gray-300">
                Buzzers are being reviewed...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Award phase - show round winner
  if (gameState.phase === "award") {
    const isWinner = gameState.roundWinner === userId;

    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 ${
          isWinner
            ? "bg-linear-to-b from-yellow-600 to-yellow-800"
            : "bg-linear-to-b from-blue-800 to-blue-900"
        }`}
      >
        <div className="text-center">
          {isWinner ? (
            <>
              <div className="text-8xl mb-6 animate-bounce">🏆</div>
              <h2 className="text-5xl font-black text-white mb-4">YOU WIN!</h2>
              <p className="text-2xl text-yellow-200">+1 Point! 🎉</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">👏</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Round Winner
              </h2>
              <p className="text-4xl font-bold text-yellow-400">
                {roundWinner?.nickname}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
