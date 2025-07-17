export type DieAction = {
    player_id: number;
    own_pawn: number;
    target_pawn?: number;
    die_value: number;
}