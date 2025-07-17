import type {Board} from "@/types/Board.ts";
import type {Space} from "@/types/Space.ts";

export function GenerateBoard(playerCount: number): Board {
    const spaceDistance = 70; // Distance between spaces
    const angleStep = (2 * Math.PI) / playerCount; // Equal angle between players
    console.log(r(angleStep));

    const board: Board = {
        spaces: []
    };

    // Add center space
    const centerSpace: Space = {
        x: 0,
        y: 0,
        color: "black"
    };
    board.spaces.push(centerSpace);

    const translationsX = [0, -35, -70, -35, 0, 35, 70, 35];
    const translationsY = [70, 35, 0, -35, -70, -35, 0, 35];

    // Create paths for each player
    for (let player = 0; player < playerCount; player++) {
        const playerAngle = player * angleStep;
        let currentAngle = playerAngle + Math.PI;
        console.log(player, r(playerAngle), r(currentAngle));

        // First space out from center (blue starting point)
        const firstSpace: Space = {
            x: spaceDistance * Math.cos(playerAngle) * 6 + translationsX[player],
            y: spaceDistance * Math.sin(playerAngle) * 6 + translationsY[player],
            color: "blue"
        };
        board.spaces.push(firstSpace);

        let prevSpace = firstSpace;

        // Straight path (4 spaces)
        for (let i = 0; i < 4; i++) {
            const newSpace: Space = {
                x: prevSpace.x + spaceDistance * Math.cos(currentAngle),
                y: prevSpace.y + spaceDistance * Math.sin(currentAngle),
                color: "black"
            };
            board.spaces.push(newSpace);
            prevSpace = newSpace;
        }

        // Left turn path (4 spaces)
        currentAngle += Math.PI + angleStep; // left turn based on angle
        console.log(r(currentAngle));
        for (let i = 0; i < 4; i++) {
            const newSpace: Space = {
                x: prevSpace.x + spaceDistance * Math.cos(currentAngle),
                y: prevSpace.y + spaceDistance * Math.sin(currentAngle),
                color: "black"
            };
            board.spaces.push(newSpace);
            prevSpace = newSpace;
        }

        // Final right turn (1 space)
        currentAngle += Math.PI / 2; // 90 degree right turn
        console.log(r(currentAngle));
        const finalSpace: Space = {
            x: prevSpace.x + spaceDistance * Math.cos(currentAngle),
            y: prevSpace.y + spaceDistance * Math.sin(currentAngle),
            color: "red" // Mark endpoint differently
        };
        board.spaces.push(finalSpace);
    }

    return board;
}

function r(num: number): number {
    return num * (180 / Math.PI);
}