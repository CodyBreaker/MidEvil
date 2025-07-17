import type { DieAction } from "./DieAction";

export type Player = {
    id: number;
    name: string;
    is_ready: boolean;
    home_base: number;
    move_die?: DieAction;
    action_die?: DieAction;
}