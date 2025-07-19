
import type { Player } from "@/types/Player";
import type { Pawn } from "@/types/Pawn";
import type { PawnState } from "@/types/PawnState";
import type { DieAction } from "@/types/DieAction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { API_URL_CLIENT } from "@/Settings";
import { CheckIcon } from "lucide-react";



interface Props {
    player: Player | null;
    pawns: Pawn[] | null;
    pawnStates: PawnState[] | null;
    dieActions: DieAction[] | null;
    players: Player[] | null;
    actionDie: DieAction | null;
}

export default function AssignTab({ player, pawns, pawnStates, dieActions, players, actionDie }: Props) {
    const [showPawnTargets, setPawnTargets] = useState<boolean>(actionDie?.die_value === 2 || actionDie?.die_value === 3 || actionDie?.die_value === 6);
    const [showOwnPawns, setShowOwnPawns] = useState<boolean>(actionDie?.die_value ? (actionDie.die_value != 3 && actionDie.die_value != 6) : false);


    const [serverActionDie, setServerActionDie] = useState<DieAction | null>(dieActions?.find(action => action.mode === "action" && action.player_id === player?.id) || null);
    const [serverMoveDie, setServerMoveDie] = useState<DieAction | null>(dieActions?.find(action => action.mode === "move" && action.player_id === player?.id) || null);

    const [moveDiceMessage, setMoveDiceMessage] = useState<string | null>(null);
    const [actionDiceMessage, setActionDiceMessage] = useState<string | null>(null);

    const [ownMovePawn, setOwnMovePawn] = useState<string>(serverMoveDie?.own_pawn?.toString() || "");
    const [ownActionPawn, setOwnActionPawn] = useState<string>(serverActionDie?.own_pawn?.toString() || "");
    const [targetActionPawn, setTargetActionPawn] = useState<string>(serverActionDie?.target_pawn?.toString() || "");

    const [isReady, setIsReady] = useState(player?.is_ready || false);

    useEffect(() => {
        if (actionDie) {
            setPawnTargets(actionDie.die_value === 2 || actionDie?.die_value === 3 || actionDie.die_value === 6);
            setShowOwnPawns(actionDie.die_value ? (actionDie.die_value !== 3 && actionDie.die_value !== 6) : false);
            setServerActionDie(dieActions?.find(action => action.mode === "action" && action.player_id === player?.id) || null);
            setServerMoveDie(dieActions?.find(action => action.mode === "move" && action.player_id === player?.id) || null);
        }

    }, [actionDie]);

    const toggleReady = () => {
        console.log("Toggling ready state for player:", JSON.stringify({
            playerId: player?.id,
            is_ready: !isReady
        }));
        handleSubmit("action", true);
        handleSubmit("move", true);
        fetch(`${API_URL_CLIENT}player.php`, {
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


    const handleSubmit = async (mode: "move" | "action", finalSave: boolean = false) => {
        if (!player || !dieActions || !dieActions.length) return;

        const action = dieActions.find(a => a.mode === mode && a.player_id === player.id);
        if (!action) return;

        console.log(targetActionPawn, "targetActionPawn");

        const payload: any = {
            id: action.id,
            playerId: player.id,
            mode,
            dieValue: action.die_value,
            ownPawn: mode === "move" ? Number(ownMovePawn) : (showOwnPawns ? Number(ownActionPawn) : null),
            targetPawn: mode === "action" && showPawnTargets ? Number(targetActionPawn) : null
        };

        const res = await fetch(API_URL_CLIENT + "/die_action.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            const pawnName = allPawns.find(p => p.id === payload.ownPawn)?.pawn_name;
            if (finalSave) {
                if (mode === "move") {
                    setMoveDiceMessage(`Your move is now set to: ${pawnName}`);
                } else if (mode === "action") {
                    const targetPawnName = allPawns.find(p => p.id === payload.targetPawn)?.pawn_name;
                    let message = "Your action is now with:\n";

                    if (pawnName && targetPawnName) {
                        message += `${pawnName}, and ${targetPawnName}`;
                    } else if (pawnName) {
                        message += `Pawn: ${pawnName}`;
                    } else if (targetPawnName) {
                        message += `Target Pawn: ${targetPawnName}`;
                    }
                    setActionDiceMessage(message);
                }
            }
        } else {
            setActionDiceMessage("Failed to set your action. Try again.");
            setMoveDiceMessage("Failed to set your action. Try again.");
        }

    };

    const ownPawns = pawns?.filter(p => p.owner_id === player?.id) || [];
    const ownPawnsNotFinished = ownPawns?.filter(p => p.position !== -2) || [];
    const allPawns = pawns?.filter(p => p.position !== -2) || [];
    const getPlayerName = (playerId: number): string => {
        return players?.find(p => p.id === playerId)?.name || "Unknown";
    };

    return (

        <div className="p-4 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Assign Die Actions</h2>
            {moveDiceMessage && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg border border-green-300 shadow-sm flex items-center gap-2 text-sm transition-all">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    {moveDiceMessage}
                </div>
            )}
            {actionDiceMessage && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg border border-green-300 shadow-sm flex items-center gap-2 text-sm transition-all">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    {actionDiceMessage}
                </div>
            )}
            <Tabs defaultValue="move" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="move">Move</TabsTrigger>
                    <TabsTrigger value="action">Action</TabsTrigger>
                </TabsList>

                <TabsContent value="move">
                    <div className="flex flex-col gap-4">
                        <Select value={ownMovePawn} onValueChange={(value) => { setMoveDiceMessage(""); setOwnMovePawn(value); handleSubmit("move"); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your pawn" />
                            </SelectTrigger>
                            <SelectContent>
                                {ownPawns.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.pawn_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>

                <TabsContent value="action">
                    <div className="flex flex-col gap-4">
                        {showOwnPawns && (
                            <Select value={ownActionPawn} onValueChange={(value) => { setActionDiceMessage(""); setOwnActionPawn(value); handleSubmit("action"); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your pawn" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ownPawnsNotFinished.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.pawn_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {showPawnTargets && (
                            <Select value={targetActionPawn} onValueChange={(value) => { setActionDiceMessage(""); setTargetActionPawn(value); handleSubmit("action"); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select target pawn" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allPawns.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {getPlayerName(p.owner_id)}: {p.pawn_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
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
