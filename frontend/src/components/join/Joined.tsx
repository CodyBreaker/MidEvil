import type { Player } from "@/types/player";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Pawn } from "@/types/Pawn";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/Settings";


type JoinedProps = {
  roomCode: string;
  handleLeaveRoom: () => void;
  player: Player | null;
};

export default function Joined({ roomCode, handleLeaveRoom, player }: JoinedProps) {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [isReady, setIsReady] = useState(player?.is_ready || false);
  const [error, setError] = useState("");
  const saveTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (player?.id) {
      fetch(`${API_URL}pawn.php?playerId=${player.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPawns(data.pawns); // expect API to return data.pawns
          } else {
            setError(data.message || "Failed to load pawns.");
          }
        })
        .catch((e) => {
          setError("Network error while fetching pawns.");
          console.log(e);
        });
    }
  }, [player]);

  const handlePawnNameChange = (id: number, newName: string) => {
    setPawns(prev =>
      prev.map(pawn => (pawn.id === id ? { ...pawn, pawn_name: newName } : pawn))
    );
    if (saveTimeouts.current[id]) {
      clearTimeout(saveTimeouts.current[id]);
    }

    // Schedule a new save to happen 500ms after the last keystroke
    saveTimeouts.current[id] = setTimeout(() => {
      const pawnToSave = pawns.find(p => p.id === id);
      if (pawnToSave) {
        savePawnName(id, newName);
      }
    }, 1000);
  };

  const savePawnName = (id: number, pawn_name: string) => {
    fetch(`${API_URL}pawn.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
        pawn_name: pawn_name
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Pawn updated successfully:", data);
        }
      })
      .catch(() => {
        alert("Network error updating pawn.");
      });
  };

  const toggleReady = () => {
    console.log("Toggling ready state for player:", JSON.stringify({
        playerId: player?.id,
        is_ready: !isReady
      }));
    fetch(`${API_URL}player.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player?.id,
        is_ready: !isReady
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsReady(!isReady);
        } else {
          alert("Failed to toggle ready.");
        }
      })
      .catch(() => {
        alert("Network error setting ready.");
      });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-l">
          Room: <span className="text-blue-600 uppercase">{roomCode}</span>
        </h2>
        <Button variant="outline" className="text-l px-6 py-4" onClick={handleLeaveRoom}>
          Leave
        </Button>
      </div>

      <hr className="mb-6" />

      {error && <p className="text-red-500">{error}</p>}

      <div>
        <h3 className="text-l font-semibold mb-2">Pawn Names</h3>
        <div className="space-y-4">
          {pawns.map((pawn, index) => (
            <div key={pawn.id} className="flex items-center gap-4">
              <span className="w-20 font-medium text-xl">{`Pawn ${index + 1}:`}</span>
              <Input
                className="w-40"
                value={pawn.pawn_name}
                onChange={e => handlePawnNameChange(pawn.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button
          className={`text-xl px-6 py-4 ${isReady ? "bg-green-600" : "bg-blue-600"}`}
          onClick={toggleReady}
        >
          {isReady ? "Ready ✅" : "Set Ready"}
        </Button>
      </div>
    </div>
  );
}