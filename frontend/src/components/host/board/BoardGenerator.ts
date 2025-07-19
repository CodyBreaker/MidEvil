import type {Board} from "@/types/Board.ts";
import type {Space} from "@/types/Space.ts";


export function GenerateBoard(playerCount: number): Board {
    const board: Board = {
        spaces: [],
        room_code: "",
        player_count: playerCount,
        bases: [],
        homes: []
    };

    const spaceDistance = 120;
    const angleStep = (2 * Math.PI) / (playerCount * 10);

    // Center space
    board.spaces.push({ x: 0, y: 0, color: "pink" });

    // Circle layout: positions 1 to playerCount * 10
    for (let i = 1; i <= playerCount * 10; i++) {
        const angle = angleStep * i;
        if (i % 10 === 0) {
            // Every 10th space is a spawn point
            board.spaces.push({
                x: Math.cos(angle) * spaceDistance * 3,
                y: Math.sin(angle) * spaceDistance * 3,
                color: "red"
            });
        } else {
            // Regular spaces
            board.spaces.push({
                x: Math.cos(angle) * spaceDistance * 3,
                y: Math.sin(angle) * spaceDistance * 3,
                color: "lightblue"
            });
        }
    }

    const baseYOffset = 300;  // vertical offset from center
    const horizontalSpacing = 20; // tight spacing between base/home cells

    for (let player = 0; player < playerCount; player++) {
        const playerBases: Space[] = [];
        const playerHomes: Space[] = [];

        for (let i = 0; i < 4; i++) {
            const baseX = (i + player * 5) * horizontalSpacing - (playerCount * 2.5 * horizontalSpacing);
            const homeX = baseX;

            // All placed near the bottom, closely packed
            playerBases.push({
                x: baseX,
                y: baseYOffset,
                color: "blue"
            });

            playerHomes.push({
                x: homeX,
                y: baseYOffset + 30, // homes just below bases
                color: "green"
            });
        }

        board.bases.push(playerBases);
        board.homes.push(playerHomes);
    }

    return board;
}

function r(num: number): number {
    return num * (180 / Math.PI);
}