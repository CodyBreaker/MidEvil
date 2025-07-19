import type { Board } from "@/types/Board.ts";
import type { Player } from "@/types/Player";
import type { Space } from "@/types/Space.ts";


export function GenerateBoard(playerCount: number, playerData: Player[]): Board {
    const board: Board = {
        spaces: [],
        room_code: "",
        player_count: playerCount,
        bases: [],
        homes: []
    };

    const spaceDistance = 120;
    const radius = spaceDistance * 3;
    const angleStep = (2 * Math.PI) / (playerCount * 10);

    const spawnAngles: number[] = [];

    // Center space
    board.spaces.push({ x: 0, y: 0, color: "pink" });

    let playerIndex = 0;
    for (let i = 1; i <= playerCount * 10; i++) {
        const angle = angleStep * (i - 1);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i % 10 === 1) {
            spawnAngles.push(angle);
            board.spaces.push({
                x,
                y,
                color: playerData[playerIndex]?.color || "black"
            });
            playerIndex++;
        } else {
            board.spaces.push({
                x,
                y,
                color: "lightblue"
            });
        }
    }

    // Generate bases and homes
    for (let i = 0; i < playerCount; i++) {
        const playerColor = playerData[i]?.color || "white";
        const angle = spawnAngles[i];

        const directionX = -Math.cos(angle); // toward center
        const directionY = -Math.sin(angle);

        // First base is already on the board (space)
        const firstBaseX = Math.cos(angle) * radius;
        const firstBaseY = Math.sin(angle) * radius;

        const baseSpaces: Space[] = [];

        // Add 4 additional bases going inward (not duplicating the space tile)
        for (let j = 1; j <= 4; j++) {
            if (j === 1) {
                baseSpaces.push({
                    x: firstBaseX + j * directionX * 40,
                    y: firstBaseY + j * directionY * 40,
                    color: playerColor
                });
            } else {
                baseSpaces.push({
                    x: firstBaseX + (j - 1) * directionX * 30 + directionX * 40,
                    y: firstBaseY + (j - 1) * directionY * 30 + directionY * 40,
                    color: playerColor
                });
            }

        }
        board.bases.push(baseSpaces);

        // === HOMES ===
        const homeOwnerIndex = (i + 4) % playerCount;
        const homeAngle = spawnAngles[homeOwnerIndex];

        const outwardX = Math.cos(homeAngle);
        const outwardY = Math.sin(homeAngle);

        // Position the center of the 2x2 square slightly beyond the circle
        const homeCenterX = outwardX * (radius + 40);
        const homeCenterY = outwardY * (radius + 40);

        // Tangent vector (perpendicular to radial direction)
        const tangentX = -outwardY;
        const tangentY = outwardX;

        const spacing = 10; // Half the distance between homes (30 total)

        // Arrange the homes around the center in a rotated 2x2 layout
        const homeSpaces: Space[] = [
            { x: homeCenterX + tangentX * -spacing + outwardX * -spacing, y: homeCenterY + tangentY * -spacing + outwardY * -spacing, color: playerColor },
            { x: homeCenterX + tangentX * spacing + outwardX * -spacing, y: homeCenterY + tangentY * spacing + outwardY * -spacing, color: playerColor },
            { x: homeCenterX + tangentX * -spacing + outwardX * spacing, y: homeCenterY + tangentY * -spacing + outwardY * spacing, color: playerColor },
            { x: homeCenterX + tangentX * spacing + outwardX * spacing, y: homeCenterY + tangentY * spacing + outwardY * spacing, color: playerColor },
        ];

        board.homes.push(homeSpaces);
    }

    return board;
}
