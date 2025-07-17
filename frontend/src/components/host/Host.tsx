import { StrictMode, useEffect, useState } from "react";
import type { Game } from "@/types/Game.ts";
import { API_URL } from "@/Settings.ts";
import '@/index.css';
import type { Player } from "@/types/player.ts";
import type { Pawn } from "@/types/Pawn.ts";
import { createRoot } from "react-dom/client";
import Preparation from "./Preperation.tsx";


export default function Host() {
    const [gameData, setGameData] = useState<Game | null>(null);
    const [playerData, setPlayerData] = useState<Player[] | null>(null);
    const [pawnData, setPawnData] = useState<Pawn[] | null>(null);
    const [_, setError] = useState<string | null>(null);
    const [hostState, setHostState] = useState<string>("preparation");


    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlRoomCode = params.get('roomCode');

        const fetchGameData = () => {
            fetch(API_URL + `game.php?roomCode=${urlRoomCode}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setGameData(data.game);
                    setPlayerData(data.players);
                    setPawnData(data.pawns);

                    switch (data.game.state) {
                        case 0: setHostState("preparation"); break;
                        case 1: setHostState("picking"); break;
                        case 2: setHostState("moving"); break;
                        case 3: setHostState("actions"); break;
                        case 4: setHostState("scoring"); break;
                        case 5: setHostState("ending"); break;
                    }

                    console.log(data);
                })
                .catch((err) => {
                    console.error('Fetch error:', err);
                    setError(err.message);
                });
        };

        // Initial fetch
        fetchGameData();

        // Repeat every 5 seconds
        const interval = setInterval(fetchGameData, 5000);

        // Cleanup
        return () => clearInterval(interval);
    }, []);


    return (
        <>
            {hostState === "preparation" &&
                <Preparation
                    gameData={gameData}
                    setGameData={setGameData}
                    playerData={playerData}
                    setPlayerData={setPlayerData}
                    pawnData={pawnData}
                    setPawnData={setPawnData}
                />
            }
        </>
    );
};


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Host />
    </StrictMode>,
)