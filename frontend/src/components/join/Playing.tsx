import type { Game } from "@/types/Game";
import { Button } from "../ui/button";
import type { Player } from "@/types/player";
import type { Pawn } from "@/types/Pawn";
import { useState } from "react";
import "./dice.css";
import type { PawnState } from "@/types/PawnState";
import type { DieAction } from "@/types/DieAction";
import { API_URL } from "@/Settings";

type PlayingProps = {
    game: Game | null;
    setGame: (game: Game) => void;
    player: Player | null;
    setPlayer: (player: Player) => void;
    pawns: Pawn[] | null;
    setPawns: (pawn: Pawn[]) => void;
    pawnStates: PawnState[] | null;
    setPawnStates: (pawnStates: PawnState[]) => void;
    dieActions: DieAction[] | null;
    setDieActions: (dieActions: DieAction[]) => void;
};

export default function Playing({ game, setGame, player, setPlayer, pawns, setPawns, pawnStates, setPawnStates, dieActions, setDieActions }: PlayingProps) {
    const [rolling, setRolling] = useState(false);
    const [diceNumber, setDiceNumber] = useState(1);
    const [diceNumber2, setDiceNumber2] = useState(1);
    const [hasRolled, setHasRolled] = useState(false);

    const rollDice = () => {
        if (rolling) return;
        setRolling(true);

        const finalNumber1 = Math.floor(Math.random() * 6) + 1;
        const finalNumber2 = Math.floor(Math.random() * 6) + 1;

        const startTime = performance.now();
        const duration = 500;
        const speed = 250;

        const diceElement1 = document.querySelector('.dice1') as HTMLElement;
        const diceElement2 = document.querySelector('.dice2') as HTMLElement;

        const axes = [
            { x: 1, y: 0, z: 1 },
            { x: 0, y: 1, z: 1 },
            { x: 1, y: 1, z: 0 },
        ];
        const axis1 = axes[Math.floor(Math.random() * axes.length)];
        const axis2 = axes[Math.floor(Math.random() * axes.length)];

        let angle1 = 0;
        let angle2 = 0;

        // Optional pre-animation face (keeps it spinning visually)
        if (finalNumber1 === 1) setDiceNumber(6);
        else setDiceNumber(1);
        if (finalNumber2 === 1) setDiceNumber2(6);
        else setDiceNumber2(1);

        const animate = (now: number) => {
            const elapsed = now - startTime;

            if (elapsed < duration) {
                angle1 += speed;
                angle2 += speed;

                diceElement1.style.transform = `rotateX(${angle1 * axis1.x}deg) rotateY(${angle1 * axis1.y}deg) rotateZ(${angle1 * axis1.z}deg)`;
                diceElement2.style.transform = `rotateX(${angle2 * axis2.x}deg) rotateY(${angle2 * axis2.y}deg) rotateZ(${angle2 * axis2.z}deg)`;

                requestAnimationFrame(animate);
            } else {
                diceElement1.style.transform = "";
                diceElement1.className = `dice dice1 show-${finalNumber1}`;
                setDiceNumber(finalNumber1);

                diceElement2.style.transform = "";
                diceElement2.className = `dice dice2 show-${finalNumber2}`;
                setDiceNumber2(finalNumber2);

                setRolling(false);
                const playerId = player?.id;

                if (playerId) {
                    setHasRolled(true);
                    fetch(API_URL + "/die_action.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            playerId,
                            mode: "move",
                            dieValue: finalNumber1,
                        }),
                    }).then(res => res.json()).then(data => {
                        console.log("Move die action result:", data);
                    });

                    fetch(API_URL + "/die_action.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            playerId,
                            mode: "action",
                            dieValue: finalNumber2,
                        }),
                    }).then(res => res.json()).then(data => {
                        console.log("Action die result:", data);
                    });
                } else {
                    console.error("Missing playerId or ownPawn");
                }
            }
        };

        requestAnimationFrame(animate);
    };

    return (
        <div className="flex flex-col items-center mt-10 gap-6">
            <div className="w-full flex justify-center gap-8">
                <div className={`dice-container ${rolling ? "rolling" : ""}`}>
                    <div className={`dice dice1 show-${diceNumber}`}>
                        <div className="face one">1</div>
                        <div className="face two">2</div>
                        <div className="face three">3</div>
                        <div className="face four">4</div>
                        <div className="face five">5</div>
                        <div className="face six">6</div>
                    </div>
                </div>
                <div className={`dice-container ${rolling ? "rolling" : ""}`}>
                    <div className={`dice dice2 show-${diceNumber2}`}>
                        <div className="face one">1</div>
                        <div className="face two">2</div>
                        <div className="face three">3</div>
                        <div className="face four">4</div>
                        <div className="face five">5</div>
                        <div className="face six">6</div>
                    </div>
                </div>
            </div>

            {!hasRolled && (
                <Button onClick={rollDice} disabled={rolling}>
                    {rolling ? "Rolling..." : "Roll Dice"}
                </Button>
            )}

            {!rolling && (
                <p className="text-lg">
                    Result: {diceNumber} + {diceNumber2}
                </p>
            )}
        </div>
    );
}