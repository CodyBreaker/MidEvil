import type { Player } from "./player";


export type Game = {
    room_code: string;
    turn: number;
    players: Player[];
}