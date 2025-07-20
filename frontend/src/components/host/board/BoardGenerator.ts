import type {Board} from "@/types/Board.ts";
import type {Space} from "@/types/Space.ts";
import type {Player} from "@/types/Player.ts";

export function GenerateBoard(playerCount: number, players: Player[], redSquares: number[]): Board {
    const spaceDistance = 50; // Distance between spaces
    const angleStep = (2 * Math.PI) / playerCount; // Equal angle between players
    const angle = angleStep / 2;
    const endPointOffset = 4;
    const spaceAmountPerPlayer = 10;
    const cornerHeight = spaceDistance / (Math.tan(angle));
    const maxdistance = 4 * spaceDistance + cornerHeight;
    const smallDistance = spaceDistance / (Math.sin(angle));
    const spaceLocations = new Array<Space>(spaceAmountPerPlayer * playerCount);
    const pathColor = "gray"

    console.log(players)
    const board: Board = {
        spaces: [],
        room_code: "",
        player_count: 0,
        bases: [],
        homes: [],
    };

    // Add center space
    const centerSpace: Space = {
        x: 0,
        y: 0,
        color: "pink"
    };
    board.spaces.push(centerSpace);

    for (let player = 0; player < playerCount; player++) {

        const playerColor = players[player]?.color || "black";

        const endSpace: Space = {
            x: Math.cos(angleStep * (player + endPointOffset)) * maxdistance,
            y: Math.sin(angleStep * (player + endPointOffset)) * maxdistance,
            color: playerColor
        }
        spaceLocations.splice(((player + endPointOffset) % playerCount) * spaceAmountPerPlayer - 1, 1, endSpace);

        const homes: Space[] = [];
        for (let i = 1; i < 5; i++) {
            const homeSpace: Space = {
                x: Math.cos(angleStep * ((player + endPointOffset) % playerCount)) * (maxdistance - 0.9 * spaceDistance * i),
                y: Math.sin(angleStep * ((player + endPointOffset) % playerCount)) * (maxdistance - 0.9 * spaceDistance * i),
                color: playerColor
            }
            homes.push(homeSpace);
        }
        board.homes.push(homes);

        // make 4 bases
        const bases: Space[] = [];
        for (let i = 1; i < 5; i++) {
            const baseSpace: Space = {
                x: Math.cos(angleStep * player) * (maxdistance + spaceDistance) + Math.sin(-1 * angleStep * player) * i * 0.5 * spaceDistance,
                y: Math.sin(angleStep * player) * (maxdistance + spaceDistance) + Math.cos(-1 * angleStep * player) * i * 0.5 * spaceDistance,
                color: playerColor
            }
            bases.push(baseSpace);
        }
        board.bases.push(bases);

        const cornerSpace: Space = {
            x: Math.cos(angleStep * player + angle) * smallDistance,
            y: Math.sin(angleStep * player + angle) * smallDistance,
            color: pathColor
        }
        spaceLocations.splice(player * spaceAmountPerPlayer + 5 - 1, 1, cornerSpace);

        const directionAngle = angleStep * player;

        for (let i = 1; i < (spaceAmountPerPlayer / 2); i++) {
            let color: string | null = pathColor
            if (i == spaceAmountPerPlayer / 2 - 1) color = playerColor;

            const lineSpace: Space = {
                x: cornerSpace.x + Math.cos(directionAngle) * spaceDistance * i,
                y: cornerSpace.y + Math.sin(directionAngle) * spaceDistance * i,
                color: color
            };
            spaceLocations.splice(player * spaceAmountPerPlayer + (5 - i) - 1, 1, lineSpace);

            const lineSpace2: Space = {
                x: lineSpace.x - Math.sin(-directionAngle) * spaceDistance * 2,
                y: lineSpace.y - Math.cos(-directionAngle) * spaceDistance * 2,
                color: pathColor
            };
            spaceLocations.splice((player - 1) * spaceAmountPerPlayer + i + 5 - 1, 1, lineSpace2);
        }
    }
    console.log(redSquares)
    redSquares.map((square: number) => {
        spaceLocations[square].color = "red";
    })

    spaceLocations.map((space: Space) => {
        board.spaces.push(space);
    })
    console.log(spaceLocations);

    return board;
}