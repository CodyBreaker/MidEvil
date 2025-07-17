import type { Player } from "@/types/player";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { Pawn } from "@/types/Pawn";
import { useEffect, useState } from "react";
import { API_URL } from "@/Settings";


type JoinedProps = {
  roomCode: string;
  handleLeaveRoom: () => void;
  player: Player | null;
};

export default function Joined({ roomCode, handleLeaveRoom, player }: JoinedProps) {
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (player?.id) {
      fetch(`${API_URL}pawn.php?playerId=${player.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log("Pawns fetched:", data);
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
  };

  const savePawnName = (pawn: Pawn) => {
    fetch(`${API_URL}update_pawn.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pawn.id,
        pawn_name: pawn.pawn_name
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          alert(`Failed to update pawn: ${data.message}`);
        }
      })
      .catch(() => {
        alert("Network error updating pawn.");
      });
  };

  const toggleReady = () => {
    fetch(`${API_URL}ready.php`, {
      method: "POST",
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
        <h2 className="font-semibold text-4xl">
          Room: <span className="text-blue-600 uppercase">{roomCode}</span>
        </h2>
        <Button variant="outline" className="text-xl px-6 py-4" onClick={handleLeaveRoom}>
          Leave
        </Button>
      </div>

      <hr className="mb-6" />

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {pawns.map(pawn => (
          <div key={pawn.id} className="flex items-center gap-4">
            <Input
              className="w-40"
              value={pawn.pawn_name}
              onChange={e => handlePawnNameChange(pawn.id, e.target.value)}
            />
            <Button onClick={() => savePawnName(pawn)}>Save</Button>
            <span className="text-sm text-gray-500">Position: {pawn.position}</span>
          </div>
        ))}
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