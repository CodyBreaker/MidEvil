import type { PawnState } from "./PawnState";

export type Pawn = {
    id: number;
    pawn_name: string;
    owner_id: number;
    position: number; //-1 ... -4 own base. Base player 1 is origin/0
    state: PawnState[]; // e.g., "active", "inactive", "captured"
}