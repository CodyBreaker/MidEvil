import { StrictMode, useEffect, useRef, useState } from "react";
import type { Game } from "@/types/Game.ts";
import { API_URL } from "@/Settings.ts";
import '@/index.css';
import type { Player } from "@/types/Player.ts";
import type { Pawn } from "@/types/Pawn.ts";
import { createRoot } from "react-dom/client";
import Preparation from "./preparation/Preparation.tsx";
import type { DieAction } from "@/types/DieAction.ts";
import TVOverview from "./simulation/TVOverview.tsx";
import type { PawnState } from "@/types/PawnState.ts";


export default function Host() {
    const [gameData, setGameData] = useState<Game | null>(null);
    const [playerData, setPlayerData] = useState<Player[]>([]);
    const [pawnData, setPawnData] = useState<Pawn[]>([]);
    const [pawnState, setPawnState] = useState<PawnState[]>([]);
    const [dieAction, setDieAction] = useState<DieAction[]>([]);
    const [_, setError] = useState<string | null>(null);
    const [hostState, setHostState] = useState<string>("preparation");
    const [showActions, setShowActions] = useState<boolean>(hostState === "simulation" || hostState === "simulating" || hostState === "actions");
    const [actionMessage, setActionMessage] = useState<string>("Waiting for players to chook a banger move...");
    const [swordSwings, setSwordSwings] = useState<{ pawnId: number; key: string }[]>([]);


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
                    if (data.game.state !== 2) {
                        setGameData(data.game);
                        setPlayerData(data.players);
                        setPawnData(data.pawns);
                        setPawnState(data.pawn_states);
                        setDieAction(data.die_actions);
                        console.log(data);
                    } else {
                        console.log("Game is in simulation state, not updating game data.");
                    }


                    const currentPlayers: Player[] = data.players || null;

                    switch (data.game.state) {
                        case 0: // Preparation
                            setHostState("preparation");
                            setShowActions(false);
                            break;
                        case 1: // Picking
                            setHostState("picking");
                            setShowActions(false);
                            break;
                        case 2: // Simulation
                            setHostState("simulation");
                            setShowActions(true);
                            break
                    }

                    if (data.game.state === 0 &&
                        currentPlayers &&
                        currentPlayers.length > 0 &&
                        currentPlayers.filter(player => player.is_ready).length === currentPlayers.length) {
                        setGameStateTurn(1, 0, data.game.room_code);
                        unreadyAllPlayers(data.players);
                        deleteAllDice(data.die_actions);
                        setHostState("picking");
                        setActionMessage("Waiting for players to chook a banger move...");
                    }

                    if (data.game.state === 1 &&
                        currentPlayers &&
                        currentPlayers.length > 0 &&
                        currentPlayers.filter(player => player.is_ready).length === currentPlayers.length) {
                        setGameStateTurn(2, 0, data.game.room_code);
                        unreadyAllPlayers(data.players);
                        setShowActions(true);
                        simulate(data.die_actions, data.pawns, data.players, data.game, data.pawn_states);
                        setHostState("simulation");
                        setActionMessage("Let's see who got cooked :)");
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

    function setGameStateTurn(newState: number, turn: number, roomCode: string) {
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

    const simulate = async (dieActions: DieAction[], pawns: Pawn[], players: Player[], game: Game, pawnStates: PawnState[]) => {
        console.log("Executing simulation...");
        const amountOfBasesToMove = 4 * 10;

        let updatedPawnData = [...pawns];
        let updatedPawnStates = pawnStates.map(pawn => ({
            ...pawn,
            counter: pawn.counter
        }));

        setPawnData([...updatedPawnData]);
        setPawnState([...updatedPawnStates]);
        const moveDice = dieActions.filter(die => die.mode === "move");
        const actionDice = dieActions.filter(die => die.mode === "action");
        // 1: Schild
        // 2: TP
        // 3: Move double
        // 4: Zwaard
        // 5: Boog
        // 6: drunk
        actionDice.sort((a, b) => a.die_value - b.die_value); // ascending
        const actionIcons: { [key: number]: string } = {
            1: "🛡️ Shield",
            2: "✨ Teleport",
            3: "🎲 Double Move",
            4: "⚔️ Sword",
            5: "🏹 Bow",
            6: "🍺 Drunk"
        };

        await new Promise(resolve => setTimeout(resolve, 1000));
        //-------- DRUNK PHASE --------
        const stepActions = actionDice.filter(die => die.die_value === 6);
        if (stepActions.length !== 0) {
            setActionMessage(`Executing action: ${actionIcons[6] || `Unknown (6)`}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            for (const die of stepActions) {


                if (die.target_pawn == null) {
                    console.log(`Pawn tried to use Drunk but no target_pawn was provided.`);
                    break;
                }

                const pawnStates = updatedPawnStates.filter(s => s.pawn_id === die.target_pawn);
                const shieldStates = pawnStates.filter(s => s.state === "shield");
                const isShielded = shieldStates.some(s => s.counter > 0);


                const drunkPawn = updatedPawnData.find(p => p.id === die.target_pawn);
                if (!drunkPawn) {
                    console.log(`Target pawn ${die.target_pawn} not found for Drunk effect`);
                    break;
                }
                if (isShielded) {
                    console.log(`Pawn ${drunkPawn.id} is shielded and cannot be made drunk.`);
                    continue;
                }
                updatedPawnStates.push({
                    id: -1, // or unique ID generator
                    pawn_id: drunkPawn.id,
                    state: "drunk",
                    counter: 3
                });
                console.log(`Pawn used Drunk on Pawn ${drunkPawn.id}`);
            }
        }

        // -------- MOVE PHASE --------

        moveDice.sort((a, b) => a.die_value - b.die_value); // ascending order
        console.log("Move Dice:", moveDice);

        const boardSize = (players.length * 10 < 40) ? 40 : players.length * 10;


        for (let step = 1; step <= 6; step++) {

            const stepDice = moveDice.filter(die => die.die_value === step);
            if (stepDice.length === 0) continue;
            setActionMessage(`Moving pawns with step ${step}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            for (const die of stepDice) {
                const pawn = updatedPawnData.find(p => p.id === die.own_pawn);
                if (!pawn) continue;

                const playerIndex = players.findIndex(player => player.id === die.player_id);

                // Find drunk states for this pawn
                const pawnStates = updatedPawnStates.filter(s => s.pawn_id === pawn.id);
                const drunkStates = pawnStates.filter(s => s.state === "drunk");
                const hasDrunk = drunkStates.some(s => s.counter > 0);

                if (pawn.position === -1) {
                    if (step === 6) {
                        pawn.position = playerIndex * 10 + 1;
                        console.log(`Pawn ${pawn.id} entered board at position ${pawn.position}`);
                    } else {
                        console.log(`Pawn ${pawn.id} is in base and cannot move with roll ${step}`);
                        continue;
                    }
                } else if (pawn.position > 0) {
                    if (hasDrunk) {
                        // Move backwards
                        pawn.position = (pawn.position - step + boardSize) % boardSize;
                        console.log(`Pawn ${pawn.id} is drunk and moved backwards ${step} steps to position ${pawn.position}`);
                    } else {
                        // Move forwards
                        pawn.position = (pawn.position + step) % boardSize;
                        console.log(`Pawn ${pawn.id} moved ${step} steps to position ${pawn.position}`);
                    }
                } else {
                    console.log(`Pawn ${pawn.id} is in base and cannot move with roll ${step}`);
                }

                if (pawn.position == (amountOfBasesToMove + 1 + (playerIndex * 10)) % boardSize) {
                    pawn.position = -2;
                }

                if (pawn.position > 0) {
                    updatedPawnData.forEach(p => {
                        if (p.id !== pawn.id && p.position === pawn.position) {
                            p.position = -1;
                            console.log(`Pawn ${pawn.id} landed on Pawn ${p.id}, sending ${p.id} to base`);
                        }
                    });
                }


                // Animation placeholder

            }
            setPawnData([...updatedPawnData]);
            setPawnState([...updatedPawnStates]);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // -------- ACTION PHASE --------

        for (let step = 1; step <= 6; step++) {

            const stepActions = actionDice.filter(die => die.die_value === step);
            if (stepActions.length === 0) continue;
            setActionMessage(`Executing action: ${actionIcons[step] || `Unknown (${step})`}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            for (const die of stepActions) {
                const pawn = updatedPawnData.find(p => p.id === die.own_pawn);
                if (!pawn) continue;

                switch (step) {
                    case 1: // Schild
                        updatedPawnStates.push({
                            id: -1, // or use uuid
                            pawn_id: pawn.id,
                            state: "shield",
                            counter: 3
                        });
                        console.log(`Pawn ${pawn.id} executed Schild action`);
                        break;

                    case 2: // TP
                        if (die.target_pawn == null) {
                            console.log(`Pawn ${pawn.id} tried to TP but no target_pawn was provided.`);
                            break;
                        }
                        const targetPawn = updatedPawnData.find(p => p.id === die.target_pawn);
                        if (!targetPawn) {
                            console.log(`Pawn ${pawn.id} tried to TP but target_pawn ${die.target_pawn} was not found.`);
                            break;
                        }
                        [pawn.position, targetPawn.position] = [targetPawn.position, pawn.position];
                        console.log(`Pawn ${pawn.id} swapped with Pawn ${targetPawn.id}`);
                        break;

                    case 3: // Move Double
                        const moveDie = moveDice.find(d => d.player_id === die.player_id);
                        if (!moveDie) {
                            console.log(`Pawn ${pawn.id} has no move die to double move`);
                            break;
                        }

                        const step = moveDie.die_value;
                        const playerIndex = players.findIndex(player => player.id === die.player_id);

                        // Find drunk states for this pawn
                        const pawnStates = updatedPawnStates.filter(s => s.pawn_id === pawn.id);
                        const drunkStates = pawnStates.filter(s => s.state === "drunk");
                        const hasDrunk = drunkStates.some(s => s.counter > 0);

                        if (pawn.position === -1) {
                            if (step === 6) {
                                pawn.position = playerIndex * 10 + 1;
                                console.log(`Pawn ${pawn.id} entered board at position ${pawn.position}`);
                            } else {
                                console.log(`Pawn ${pawn.id} is in base and cannot move with roll ${step}`);
                                continue;
                            }
                        } else if (pawn.position > 0) {
                            if (hasDrunk) {
                                // Move backwards
                                pawn.position = (pawn.position - step + boardSize) % boardSize;
                                console.log(`Pawn ${pawn.id} is drunk and moved backwards ${step} steps to position ${pawn.position}`);
                            } else {
                                // Move forwards
                                pawn.position = (pawn.position + step) % boardSize;
                                console.log(`Pawn ${pawn.id} moved ${step} steps to position ${pawn.position}`);
                            }
                        } else {
                            console.log(`Pawn ${pawn.id} is in base and cannot move with roll ${step}`);
                        }

                        if (pawn.position == (amountOfBasesToMove + 1 + (playerIndex * 10)) % boardSize) {
                            pawn.position = -2;
                        }

                        if (pawn.position > 0) {
                            updatedPawnData.forEach(p => {
                                if (p.id !== pawn.id && p.position === pawn.position) {
                                    p.position = -1;
                                    console.log(`Pawn ${pawn.id} landed on Pawn ${p.id}, sending ${p.id} to base`);
                                }
                            });
                        }
                        break;

                    case 4: // Zwaard
                        for (let offset = -2; offset <= 2; offset++) {
                            if (offset === 0) continue;

                            const checkPos = (pawn.position + offset + boardSize) % boardSize;

                            updatedPawnData.forEach(p => {
                                const pawnStates = updatedPawnStates.filter(s => s.pawn_id === p.id);
                                const shieldStates = pawnStates.filter(s => s.state === "shield");
                                const hasShield = shieldStates.some(s => s.counter > 0);

                                if (
                                    p.owner_id !== pawn.owner_id &&
                                    p.position === checkPos &&
                                    !hasShield
                                ) {
                                    setSwordSwings(prev => [...prev, { pawnId: pawn.id, key: `${pawn.id}-${Date.now()}` }]);
                                    p.position = -1;
                                    console.log(`Pawn ${pawn.id} used Zwaard and hit enemy pawn ${p.id} at ${checkPos}`);
                                }
                            });
                        }
                        break;

                    case 5: // Boog
                        for (let i = 1; i <= 5; i++) {
                            const checkPos = (pawn.position + i) % boardSize;

                            updatedPawnData.forEach(p => {
                                const pawnStates = updatedPawnStates.filter(s => s.pawn_id === p.id);
                                const shieldStates = pawnStates.filter(s => s.state === "shield");
                                const hasShield = shieldStates.some(s => s.counter > 0);

                                if (
                                    p.owner_id !== pawn.owner_id &&
                                    p.position === checkPos &&
                                    !hasShield
                                ) {
                                    p.position = -1;
                                    console.log(`Pawn ${pawn.id} used Boog and hit enemy pawn ${p.id} at ${checkPos}`);
                                }
                            });
                        }
                        break;
                }

            }
            setPawnData([...updatedPawnData]);
            setPawnState([...updatedPawnStates]);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        const newUpdatedPawnStates = updatedPawnStates.map(pawn => ({
            ...pawn,
            counter: pawn.counter - 1
        }));

        // You might also want to update state from action phase here
        console.log("Repeating simulation...");
        console.log("Updated Pawn Data:", updatedPawnData);
        console.log("Updated Pawn States:", updatedPawnStates);
        if (checkWinConditions(updatedPawnData, playerData)) {
            console.log("Win conditions met!");
        } else {
            pushPawnData(updatedPawnData);
            pushPawnState(newUpdatedPawnStates);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setGameStateTurn(1, ((game?.turn ?? 0) + 1), game?.room_code || "0");
            unreadyAllPlayers(players);
            deleteAllDice(dieActions);
            setShowActions(false);
            setHostState("picking");
            setActionMessage("Waiting for players to chook a banger move...");
        }
    };


    function checkWinConditions(updatedPawnData: Pawn[], players: Player[]) {
        for (const player of players) {
            const playerPawns = updatedPawnData.filter(pawn => pawn.owner_id === player.id);
            const allPawnsAtEnd = playerPawns.every(pawn => pawn.position === -2);
            if (allPawnsAtEnd) {
                console.log(`Player ${player.id} has won the game!`);
                return true; // Win condition met
            }
        }
        return false; // No win condition met
    }

    function pushPawnData(pawns: Pawn[]) {
        for (const pawn of pawns) {
            console.log("Pushing pawn data:", pawn);
            fetch(`${API_URL}pawn.php`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pawn)
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        console.error("Failed to update pawns:", data.message);
                    }
                })
                .catch(err => console.error("Network error while updating pawns:", err));
        }
    }

    function pushPawnState(pawnStates: PawnState[]) {
        for (const state of pawnStates) {
            console.log("Pushing pawn state:", state);
            if (state.id === -1) {
                fetch(`${API_URL}pawn_state.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(state)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (!data.success) {
                            console.error("Failed to create pawn state:", data.message);
                        }
                    })
                    .catch(err => console.error("Network error while creating pawn state:", err));
            } else if (state.counter <= 0) {
                fetch(`${API_URL}pawn_state.php`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: state.id })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (!data.success) {
                            console.error("Failed to delete pawn state:", data.message);
                        }
                    })
                    .catch(err => console.error("Network error while deleting pawn state:", err));
            } else {
                fetch(`${API_URL}pawn_state.php`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(state)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (!data.success) {
                            console.error("Failed to update pawn state:", data.message);
                        }
                    })
                    .catch(err => console.error("Network error while updating pawn state:", err));
            }
        }
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
            {(hostState === "picking" || hostState === "simulation" || hostState === "simulating") && (
                <TVOverview
                    gameData={gameData}
                    pawnState={pawnState}
                    dieAction={dieAction}
                    playerData={playerData}
                    pawnData={pawnData}
                    showActions={showActions}
                    hostState={hostState}
                    actionMessage={actionMessage}
                    swordSwings={swordSwings}
                    setSwordSwings={setSwordSwings}
                />
            )}
            {/* {hostState === "picking" && (
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
            )} */}
        </>
    );
};


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Host />
    </StrictMode>,
)

