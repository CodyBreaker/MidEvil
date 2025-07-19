import '@/index.css';
import type { DieAction } from '@/types/DieAction';
import type { Pawn } from '@/types/Pawn';
import type { Player } from '@/types/Player';
import PlayerCard from './PlayerCard';
import type { PawnState } from '@/types/PawnState';
import { useEffect } from 'react';
import { BoardRenderer } from '../board/BoardRenderer';

interface TVOverviewProps {
    playerData: Player[];
    pawnData: Pawn[];
    pawnState: PawnState[];
    dieAction: DieAction[];
    showActions: boolean;
    hostState: string;
    actionMessage: string;
    swordSwings: { pawnId: number; key: string }[];
    setSwordSwings: React.Dispatch<React.SetStateAction<{ pawnId: number; key: string }[]>>;
    redSquares: number[];
    arrowAnimations: { id: number; fromIndex: number; toIndex: number }[];
}

export default function TVOverview({
    playerData,
    pawnData,
    pawnState,
    dieAction,
    showActions,
    hostState,
    actionMessage,
    swordSwings,
    setSwordSwings,
    redSquares,
    arrowAnimations
}: TVOverviewProps) {
    const leftPlayers = playerData.filter((_, index) => index % 2 === 0).slice(0, 6);
    const rightPlayers = playerData.filter((_, index) => index % 2 === 1).slice(0, 6);

    useEffect(() => {
        console.log("Host state changed:", hostState);
    }, [hostState]);


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
                        showActions={showActions}
                        left={true}
                    />
                ))}
            </div>

            {/* Game Board */}
            <BoardRenderer
                playerCount={playerData?.length > 3 ? playerData.length : 4}
                pawnData={pawnData}
                playerData={playerData}
                pawnStatesData={pawnState}
                actionMessage={actionMessage}
                swordSwings={swordSwings}
                setSwordSwings={setSwordSwings}
                redSquares={redSquares}
                arrowAnimations={arrowAnimations}
            />

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
                        showActions={showActions}
                        left={false}
                    />
                ))}
            </div>
        </div>
    );
}
