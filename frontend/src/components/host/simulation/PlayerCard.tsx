import '@/index.css';
import type { DieAction } from '@/types/DieAction';
import type { Pawn } from '@/types/Pawn';
import type { PawnState } from '@/types/PawnState';
import type { Player } from '@/types/Player';

interface PlayerCardProps {
    playerData: Player[];
    pawnData: Pawn[] | null;
    pawnState: PawnState[] | null;
    dieAction: DieAction[] | null;
    player_id: number;
    showActions: boolean;
}

export default function PlayerCard({
    playerData,
    pawnData,
    pawnState,
    dieAction,
    player_id,
    showActions
}: PlayerCardProps) {
    const player = playerData.find(p => p.id === player_id);
    if (!player) return null;

    const playerPawns = pawnData?.filter(pawn => pawn.owner_id === player_id) || [];
    const amountOfBasesToMove = 4 * 10;
    const playerIndex = playerData.findIndex(player => player.id === player_id);

    // Sort actions: move first, then action
    const playerActions = (dieAction?.filter(a => a.player_id === player_id) || []).sort((a, b) => {
        if (a.mode === 'move') return -1;
        if (b.mode === 'move') return 1;
        return 0;
    });

    const getPawnNameById = (id: number | undefined) =>
        pawnData?.find(p => p.id === id)?.pawn_name ?? 'Unknown';

    const getPawnStates = (pawnId: number): PawnState[] => {
        return pawnState?.filter(s => s.pawn_id === pawnId) || [];
    };

    const renderStateEmoji = (state: string) => {
        switch (state.toLowerCase()) {
            case 'shield':
                return '🛡️';
            case 'drunk':
                return '🍺';
            case 'poisoned':
                return '☠️';
            case 'frozen':
                return '❄️';
            case 'burning':
                return '🔥';
            default:
                return '✨'; // fallback
        }
    };

    const DieActionSection = showActions && (
        <div className="w-1/3 bg-white/30 flex flex-row justify-evenly items-center px-2 text-xs font-semibold text-white border-white/50 border-l">
            {playerActions.map((action) => {
                const isAction = action.mode === "action";
                const actionIcons: Record<number, string> = {
                    1: "🛡️", // Shield
                    2: "✨",  // Teleport
                    3: "🎲",  // Move Double
                    4: "⚔️", // Zwaard
                    5: "🏹", // Boog
                    6: "🍺", // Alcohol
                };

                return (
                    <div key={action.id} className="text-center mx-1">
                        <div className="uppercase text-[10px] text-white/70">{action.mode}</div>

                        <div className="text-white text-base font-bold">
                            {isAction ? `${actionIcons[action.die_value] || "🎲"}` : `🎲 ${action.die_value}`}
                        </div>

                        <div className="text-[11px] capitalize">{action.mode}</div>

                        <div className="text-[10px] mt-1">
                            <span className="block">🟢 {getPawnNameById(action.own_pawn)}</span>
                            {action.target_pawn != null && (
                                <span className="block">🔴 {getPawnNameById(action.target_pawn)}</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div
            className="h-[14vh] w-[24rem] rounded-xl flex overflow-hidden border-2 shadow-md"
            style={{
                backgroundColor: player.color || '#ccc',
                borderColor: 'rgba(255,255,255,0.3)'
            }}
        >
            {/* Left-side actions for odd players */}
            {player_id % 2 === 0 && DieActionSection}

            {/* Center content */}
            <div className="w-2/3 p-2 flex flex-col justify-between text-white">
                {/* Player Name */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-white opacity-90" />
                        <div className="font-bold text-sm truncate">{player.name}</div>
                    </div>
                    <div
                        className={`text-xs font-bold px-2 py-[2px] rounded-full ${player.is_ready ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                        title={player.is_ready ? 'Ready' : 'Not Ready'}
                    >
                        {player.is_ready ? 'READY' : 'WAIT'}
                    </div>
                </div>

                {/* 2x2 Pawn Grid */}
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    {playerPawns.map((pawn) => {
                        const states = getPawnStates(pawn.id);
                        return (
                            <div key={pawn.id}>
                                <div className="font-semibold truncate">
                                    {pawn.pawn_name} - {pawn.position === -1 ? "base" : amountOfBasesToMove + playerIndex * 10 - pawn.position}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1 text-[12px]">
                                    {states.map((state) => (
                                        <span
                                            key={state.state}
                                            className="px-1 rounded-full bg-white/30"
                                            title={state.state}
                                        >
                                            {renderStateEmoji(state.state)} {state.counter}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right-side actions for even players */}
            {player_id % 2 !== 0 && DieActionSection}
        </div>
    );
}