import type { Game } from "@/types/Game";
import { Button } from "../ui/button";
import type { Player } from "@/types/player";
import type { Pawn } from "@/types/Pawn";
import { useState } from "react";
import "./dice.css";

type PlayingProps = {
    game?: Game | null;
    setGame?: (game: Game) => void;
    player?: Player | null;
    setPlayer?: (player: Player) => void;
    pawns?: Pawn[] | null;
    setPawns?: (pawn: Pawn[]) => void;
};


export default function Playing({ game, setGame, player, setPlayer, pawns, setPawns }: PlayingProps) {
    const [rolling, setRolling] = useState(false);
    const [diceNumber, setDiceNumber] = useState(1);

    const rollDice = () => {
        if (rolling) return;
        setRolling(true);

        const finalNumber = Math.floor(Math.random() * 6) + 1;
        const startTime = performance.now();
        const duration = 500;

        const diceElement = document.querySelector('.dice') as HTMLElement;

        // Random rotation axis (single direction vector)
        const axes = [
            { x: 1, y: 0, z: 1 },
            { x: 0, y: 1, z: 1 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
        ];
        const axis = axes[Math.floor(Math.random() * axes.length)];

        let angle = 0;
        const speed = 250; // degrees per frame, fast spin

        if (finalNumber === 1) {
            setDiceNumber(6);
        } else {
            setDiceNumber(1);
        }

        const animate = (now: number) => {
            const elapsed = now - startTime;

            if (elapsed < duration) {
                angle += speed;

                diceElement.style.transform = `rotateX(${angle * axis.x}deg) rotateY(${angle * axis.y}deg) rotateZ(${angle * axis.z}deg)`;
                requestAnimationFrame(animate);
            } else {
                // Final snap to correct face
                diceElement.style.transform = ""; // reset style transform
                diceElement.className = `dice show-${finalNumber}`;
                setDiceNumber(finalNumber);
                setRolling(false);
                console.log("Final result:", finalNumber);
            }
        };

        requestAnimationFrame(animate);
    };


    return (
        <div className="flex flex-col items-center mt-10 gap-6">
            <div className={`dice-container ${rolling ? "rolling" : ""}`}>
                <div className={`dice show-${diceNumber}`}>
                    <div className="face one">1</div>
                    <div className="face two">2</div>
                    <div className="face three">3</div>
                    <div className="face four">4</div>
                    <div className="face five">5</div>
                    <div className="face six">6</div>
                </div>
            </div>
            <Button onClick={rollDice} disabled={rolling}>
                {rolling ? "Rolling..." : "Roll Dice"}
            </Button>
            {!rolling && <p className="text-lg">Result: {diceNumber}</p>}
        </div>
    );
}
