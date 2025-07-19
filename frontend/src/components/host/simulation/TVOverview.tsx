import '@/index.css';
import type { DieAction } from '@/types/DieAction';
import type { Game } from '@/types/Game';
import type { Pawn } from '@/types/Pawn';
import type { Player } from '@/types/Player';
import PlayerCard from './PlayerCard';
import type { PawnState } from '@/types/PawnState';
import { use, useEffect, useState } from 'react';
import { BoardRenderer } from '../board/BoardRenderer';

interface TVOverviewProps {
    gameData: Game | null;
    playerData: Player[];
    pawnData: Pawn[];
    pawnState: PawnState[];
    dieAction: DieAction[];
    showActions: boolean;
    hostState: string;
    actionMessage: string;
}

export default function TVOverview({
    gameData,
    playerData,
    pawnData,
    pawnState,
    dieAction,
    showActions,
    hostState,
    actionMessage
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
                    />
                ))}
            </div>

            {/* Game Board */}
            <BoardRenderer
                playerCount={10}
                pawnData={pawnData}
                playerData={playerData}
                pawnStatesData={pawnState}
                actionMessage={actionMessage}
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
                    />
                ))}
            </div>
        </div>
    );
}
