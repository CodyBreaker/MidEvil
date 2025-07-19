export type Board = {
    room_code: string;
    player_count: number;
    spaces: Space[];
    bases: Space[][];
    homes: Space[][];
    spawns: Space[][];
}