export type PawnState = {
    id: number;
    pawn_id: number;
    state: string; // e.g., "active", "inactive", "captured"
    counter: number;
}