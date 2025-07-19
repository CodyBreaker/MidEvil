import type {Board} from "@/types/Board.ts";
import type {Space} from "@/types/Space.ts";

export function GenerateBoard(playerCount: number): Board {
    const spaceDistance = 70; // Distance between spaces
    const angleStep = (2 * Math.PI) / playerCount; // Equal angle between players
    console.log(r(angleStep));

    const board: Board = {
        spaces: [],
        room_code: "",
        player_count: 0,
        bases: [],
        homes: [],
        spawns: []
    };

    // Add center space
    const centerSpace: Space = {
        x: 0,
        y: 0,
        color: "pink"
    };
    board.spaces.push(centerSpace);

    const angle = angleStep / 2;
    const cornerHeight = spaceDistance / (Math.tan(angle));
    const maxdistance = 4 * spaceDistance + cornerHeight;
    const smallDistance = spaceDistance / (Math.sin(angle));

    for (let player = 0; player < playerCount; player++) {
        const graySpace: Space = {
            x: Math.cos(angleStep * player) * maxdistance,
            y: Math.sin(angleStep * player) * maxdistance,
            color: "gray"
        }
        const cornerSpace: Space = {
            x: Math.cos(angleStep * player + angle) * smallDistance,
            y: Math.sin(angleStep * player + angle) * smallDistance,
            color: "black"
        }

        const directionAngle = angleStep * player;
        console.log(directionAngle);

        for (let i = 1; i < 5; i++) {
            const lineSpace: Space = {
                x: cornerSpace.x + Math.cos(directionAngle) * spaceDistance * i,
                y: cornerSpace.y + Math.sin(directionAngle) * spaceDistance * i,
                color: "lightgray"
            };
            board.spaces.push(lineSpace);
            console.log(lineSpace);
        }

        board.spaces.push(graySpace);
        console.log(graySpace);

        board.spaces.push(cornerSpace);
        console.log(cornerSpace);
    }

    return board;
}

function r(num: number): number {
    return num * (180 / Math.PI);
}