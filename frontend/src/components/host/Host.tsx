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
        fetch(API_URL + 'game.php?roomCode=ewa')
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
                if (data.game.state === 0) {
                    setHostState("preparation");
                } else if (data.game.state === 1) {
                    setHostState("picking");
                } else if (data.game.state === 2) {
                    setHostState("moving");
                } else if (data.game.state === 3) {
                    setHostState("actions");
                } else if (data.game.state === 4) {
                    setHostState("scoring");
                } else if (data.game.state === 5) {
                    setHostState("ending");
                }
                console.log(data);
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                setError(err.message);
            });
    }, []); // Empty dependency array to run once on mount

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