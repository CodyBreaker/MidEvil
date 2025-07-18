import { StrictMode, useEffect, useState } from "react";
import type { Game } from "@/types/Game.ts";
import { API_URL } from "@/Settings.ts";
import '@/index.css';
import type { Player } from "@/types/player.ts";
import type { Pawn } from "@/types/Pawn.ts";
import { createRoot } from "react-dom/client";
import Preparation from "./preparation/Preparation.tsx";
import type { DieAction } from "@/types/DieAction.ts";


export default function Host() {
    const [gameData, setGameData] = useState<Game | null>(null);
    const [playerData, setPlayerData] = useState<Player[]>([]);
    const [pawnData, setPawnData] = useState<Pawn[] | null>([]);
    const [pawnState, setPawnState] = useState<Pawn[] | null>([]);
    const [dieAction, setDieAction] = useState<Pawn[] | null>([]);
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
                    setPawnState(data.pawn_states);
                    setDieAction(data.die_actions);
                    console.log(data);

                    switch (data.game.state) {
                        case 0: setHostState("preparation"); break;
                        case 1: setHostState("picking"); break;
                        case 2: setHostState("moving"); break;
                        case 3: setHostState("actions"); break;
                        case 4: setHostState("scoring"); break;
                        case 5: setHostState("ending"); break;
                    }

                    const currentPlayers: Player[] = data.players || null;

                    if (data.game.state === 0 &&
                        currentPlayers &&
                        currentPlayers.length > 0 &&
                        currentPlayers.filter(player => player.is_ready).length === currentPlayers.length) {
                        setGameStateTurn(1, 0, data.game.room_code);
                        unreadyAllPlayers(data.players);
                        deleteAllDice(data.die_actions);
                        setHostState("picking");
                    }


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

    function setGameStateTurn(newState: number, turn: number, roomCode: number) {
        fetch(`${API_URL}game.php`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode: roomCode, state: newState, turn: turn }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setGameData(data.game);
                } else {
                    setError(data.message || "Failed to update game state.");
                }
            })
            .catch(() => {
                setError("Network error while updating game state.");
            });
    }

    async function unreadyAllPlayers(players: Player[] | null) {
        if (!players) return;

        for (const player of players.filter(p => p.is_ready)) {
            const unreadyPayload = {
                playerId: player.id,
                is_ready: false
            };

            try {
                const res = await fetch(`${API_URL}player.php`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(unreadyPayload)
                });

                const data = await res.json();

                if (!data.success) {
                    console.error(`Failed to unready player ${player.id}:`, data.message);
                    setError(data.message || `Failed to unready player ${player.id}.`);
                }
            } catch (error) {
                console.error(`Network error for player ${player.id}:`, error);
                setError(`Network error while unreadying player ${player.id}.`);
            }
        }

        setPlayerData(players.map(p => ({ ...p, is_ready: false })));
    }

    async function deleteAllDice(dieActions: DieAction[] | null) {
        console.log("Deleting all dice actions...", dieActions);
        if (!dieActions) return;

        for (const action of dieActions) {
            const unreadyPayload = {
                playerId: action.player_id
            };

            try {
                const res = await fetch(`${API_URL}die_action.php`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(unreadyPayload)
                });

                const data = await res.json();

                if (!data.success) {
                    console.error(`Failed to delete die action ${action.player_id}:`, data.message);
                    setError(data.message || `Failed to delete die action ${action.player_id}.`);
                }
            } catch (error) {
                console.error(`Network error for die action ${action.player_id}:`, error);
                setError(`Network error while deleting die action ${action.player_id}.`);
            }
        }

        setDieAction([]); // Clear the die actions state
    }


    return (
        <>
            {hostState === "preparation" &&
                <Preparation
                    gameData={gameData}
                    playerData={playerData}
                    pawnData={pawnData}
                />
            }
            {hostState === "picking" && (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-800 to-black text-white text-center px-6">
                    <h2 className="text-5xl font-extrabold mb-6 animate-pulse tracking-wider drop-shadow-lg">
                        ⚔️ The Battle Begins ⚔️
                    </h2>
                    <p className="text-xl md:text-2xl mb-8 text-purple-300">
                        Players are choosing their destiny and rolling the dice of fate...
                    </p>

                    <div className="bg-black bg-opacity-30 p-6 rounded-2xl border border-purple-600 shadow-lg max-w-md w-full">
                        <p className="text-purple-400">Prepare for battle... Your move awaits.</p>
                        <p className="text-purple-400">{playerData?.filter(player => player.is_ready).length} players of the {playerData?.length} are ready</p>
                    </div>
                </div>
            )}
        </>
    );
};


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Host />
    </StrictMode>,
)