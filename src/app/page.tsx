"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const CHRISTMAS_NAMES = [
  "Rudolph",
  "Frosty",
  "Jingle",
  "Snowflake",
  "Tinsel",
  "Holly",
  "Ginger",
  "Candy",
  "Nutcracker",
  "Sparkle",
  "Blitzen",
  "Prancer",
  "Comet",
  "Cupid",
  "Dasher",
];

type Step = "role" | "room" | "nickname";

// Pre-generate snowflake positions to avoid Math.random during render
const SNOWFLAKE_COUNT = 60;
const snowflakeStyles = Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 1.7) % 100}%`,
  animationDelay: `${(i * 0.3) % 5}s`,
  animationDuration: `${8 + ((i * 0.2) % 12)}s`,
  fontSize: `${0.5 + ((i * 0.02) % 1)}rem`,
  opacity: 0.3 + ((i * 0.01) % 0.5),
}));

// Get initial nickname (called once on mount)
function getInitialNickname(): string {
  return CHRISTMAS_NAMES[Math.floor(Math.random() * CHRISTMAS_NAMES.length)];
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [isSpectator, setIsSpectator] = useState(false);
  const [roomAction, setRoomAction] = useState<"create" | "join" | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [nickname, setNickname] = useState(getInitialNickname);

  // Generate or retrieve UUID on mount
  useEffect(() => {
    let storedId = localStorage.getItem("buzzer-user-id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("buzzer-user-id", storedId);
    }
  }, []);

  const handleRoleSelect = (spectator: boolean) => {
    setIsSpectator(spectator);
    setStep("room");
  };

  const handleRoomAction = (action: "create" | "join") => {
    setRoomAction(action);
    if (action === "create") {
      // For create, go directly to nickname (or game if spectator)
      if (isSpectator) {
        localStorage.setItem("buzzer-role", "spectator");
        localStorage.setItem("buzzer-room-action", "create");
        router.push("/game");
      } else {
        setStep("nickname");
      }
    }
    // For join, stay on room step to enter code
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim()) return;
    localStorage.setItem(
      "buzzer-room-code",
      roomCodeInput.toUpperCase().trim()
    );

    if (isSpectator) {
      localStorage.setItem("buzzer-role", "spectator");
      localStorage.setItem("buzzer-room-action", "join");
      router.push("/game");
    } else {
      setStep("nickname");
    }
  };

  const handleJoinGame = () => {
    if (!nickname.trim()) return;
    localStorage.setItem("buzzer-nickname", nickname.trim());
    localStorage.setItem("buzzer-role", "player");
    localStorage.setItem("buzzer-room-action", roomAction || "create");
    if (roomCodeInput) {
      localStorage.setItem(
        "buzzer-room-code",
        roomCodeInput.toUpperCase().trim()
      );
    }
    router.push("/game");
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-red-900 via-red-800 to-green-900 overflow-hidden">
      {/* Animated snow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {snowflakeStyles.map((style) => (
          <div
            key={style.id}
            className="snowflake absolute text-white"
            style={{
              left: style.left,
              animationDelay: style.animationDelay,
              animationDuration: style.animationDuration,
              fontSize: style.fontSize,
              opacity: style.opacity,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 safe-area">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4 drop-shadow-lg">🎄🔔🎄</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 text-festive">
            Christmas
          </h1>
          <h2 className="text-3xl md:text-4xl font-black text-yellow-400 text-festive">
            Hot Buzzer
          </h2>
        </div>

        {/* Step 1: Role Selection */}
        {step === "role" && (
          <div className="w-full max-w-md space-y-4">
            <button
              onClick={() => handleRoleSelect(false)}
              className="w-full py-6 px-8 bg-linear-to-r from-green-500 to-green-600 
                       hover:from-green-400 hover:to-green-500 
                       text-white text-2xl font-bold rounded-2xl 
                       transform transition-all hover:scale-105 active:scale-95
                       shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
            >
              <span className="text-3xl">🎮</span>
              <span>Join as Player</span>
            </button>

            <button
              onClick={() => handleRoleSelect(true)}
              className="w-full py-5 px-8 bg-linear-to-r from-gray-700 to-gray-800 
                       hover:from-gray-600 hover:to-gray-700 
                       text-white text-xl font-semibold rounded-2xl 
                       transform transition-all hover:scale-105 active:scale-95
                       shadow-lg shadow-gray-900/30 flex items-center justify-center gap-3"
            >
              <span className="text-2xl">📺</span>
              <span>Spectator Mode (TV)</span>
            </button>
          </div>
        )}

        {/* Step 2: Room Selection */}
        {step === "room" && (
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-6">
              <p className="text-green-300 text-lg">
                {isSpectator ? "📺 Spectator Mode" : "🎮 Player Mode"}
              </p>
            </div>

            {roomAction !== "join" ? (
              <>
                <button
                  onClick={() => handleRoomAction("create")}
                  className="w-full py-5 px-8 bg-linear-to-r from-yellow-500 to-orange-500 
                           hover:from-yellow-400 hover:to-orange-400 
                           text-white text-xl font-bold rounded-2xl 
                           transform transition-all hover:scale-105 active:scale-95
                           shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">🏠</span>
                  <span>Create New Room</span>
                </button>

                <button
                  onClick={() => setRoomAction("join")}
                  className="w-full py-5 px-8 bg-linear-to-r from-blue-500 to-blue-600 
                           hover:from-blue-400 hover:to-blue-500 
                           text-white text-xl font-bold rounded-2xl 
                           transform transition-all hover:scale-105 active:scale-95
                           shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">🚪</span>
                  <span>Join Existing Room</span>
                </button>
              </>
            ) : (
              <div className="glass rounded-2xl p-6">
                <label className="block text-white text-lg font-semibold mb-3">
                  Enter Room Code
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) =>
                    setRoomCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder="e.g., SANTA42"
                  maxLength={15}
                  autoFocus
                  className="w-full px-5 py-4 text-2xl text-center font-bold tracking-wider rounded-xl 
                           bg-white/90 text-gray-900 placeholder-gray-400
                           border-2 border-transparent focus:border-yellow-400
                           outline-none transition-all uppercase"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoinRoom();
                  }}
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomCodeInput.trim()}
                  className="w-full mt-4 py-4 px-8 bg-linear-to-r from-green-500 to-green-600 
                           hover:from-green-400 hover:to-green-500 
                           disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                           text-white text-xl font-bold rounded-2xl 
                           transform transition-all hover:scale-105 active:scale-95"
                >
                  Join Room →
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setStep("role");
                setRoomAction(null);
                setRoomCodeInput("");
              }}
              className="w-full py-3 px-6 text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Nickname (players only) */}
        {step === "nickname" && (
          <div className="w-full max-w-md">
            <div className="glass rounded-2xl p-6 mb-6">
              <label className="block text-white text-lg font-semibold mb-3">
                What&apos;s your name?
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={20}
                autoFocus
                className="w-full px-5 py-4 text-xl rounded-xl 
                         bg-white/90 text-gray-900 placeholder-gray-500
                         border-2 border-transparent focus:border-yellow-400
                         outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinGame();
                }}
              />
              <p className="text-sm text-gray-400 mt-2">Or tap a suggestion:</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {CHRISTMAS_NAMES.slice(0, 6).map((name) => (
                  <button
                    key={name}
                    onClick={() => setNickname(name)}
                    className={`px-3 py-1 rounded-full text-sm transition-all
                              ${
                                nickname === name
                                  ? "bg-yellow-500 text-black"
                                  : "bg-white/20 text-white hover:bg-white/30"
                              }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleJoinGame}
                disabled={!nickname.trim()}
                className="w-full py-5 px-8 bg-linear-to-r from-green-500 to-green-600 
                         hover:from-green-400 hover:to-green-500 
                         disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                         text-white text-xl font-bold rounded-2xl 
                         transform transition-all hover:scale-105 active:scale-95
                         shadow-lg shadow-green-500/30"
              >
                🎮 Join as {nickname || "..."}
              </button>

              <button
                onClick={() => setStep("room")}
                className="w-full py-3 px-6 text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-gray-400 text-sm">
          <p>🎅 Merry Christmas! 🤶</p>
        </div>
      </div>
    </main>
  );
}
