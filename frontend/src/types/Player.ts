import type { DieAction } from "./DieAction";

export type Player = {
    id: number;
    name: string;
    color: string | null;
    is_ready: boolean;
    move_die?: DieAction;
    action_die?: DieAction;
}