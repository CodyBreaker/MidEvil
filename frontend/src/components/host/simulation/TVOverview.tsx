import '@/index.css';
import type { DieAction } from '@/types/DieAction';
import type { Game } from '@/types/Game';
import type { Pawn } from '@/types/Pawn';
import type { Player } from '@/types/player';
import PlayerCard from './PlayerCard';
import type { PawnState } from '@/types/PawnState';

interface TVOverviewProps {
    gameData: Game | null;
    playerData: Player[];
    pawnData: Pawn[] | null;
    setGameData: (data: Game | null) => void;
    setPlayerData: (data: Player[]) => void;
    setPawnData: (data: Pawn[] | null) => void;
    pawnState: PawnState[] | null;
    setPawnState: (state: PawnState[] | null) => void;
    dieAction: DieAction[] | null;
    setDieAction: (action: DieAction[] | null) => void;
}

export default function TVOverview({
    gameData,
    playerData,
    pawnData,
    setGameData,
    setPlayerData,
    setPawnData,
    pawnState,
    setPawnState,
    dieAction,
    setDieAction
}: TVOverviewProps) {
    const leftPlayers = playerData.filter((_, index) => index % 2 === 0).slice(0, 6);
    const rightPlayers = playerData.filter((_, index) => index % 2 === 1).slice(0, 6);

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-white">
            {/* Left Players */}
            <div className="flex flex-col justify-center items-end h-[90vh] space-y-4 pr-4">
                {leftPlayers.map((player) => (
                    <PlayerCard
                        key={player.id}
                        playerData={playerData}
                        pawnData={pawnData}
                        pawnState={pawnState}
                        dieAction={dieAction}
                        player_id={player.id}
                    />
                ))}
            </div>

            {/* Game Board */}
            <div className="flex items-center justify-center w-[90vh] h-[90vh] bg-red-600 rounded-lg shadow-lg mx-4">
                {/* The board content goes here */}
            </div>

            {/* Right Players */}
            <div className="flex flex-col justify-center items-start h-[90vh] space-y-4 pl-4">
                {rightPlayers.map((player) => (
                    <PlayerCard
                        key={player.id}
                        playerData={playerData}
                        pawnData={pawnData}
                        pawnState={pawnState}
                        dieAction={dieAction}
                        player_id={player.id}
                    />
                ))}
            </div>
        </div>
    );
}
