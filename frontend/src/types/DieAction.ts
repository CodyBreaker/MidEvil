export type DieAction = {
    id: number;
    mode: string;
    player_id: number;
    own_pawn: number;
    target_pawn?: number;
    die_value: number;
}