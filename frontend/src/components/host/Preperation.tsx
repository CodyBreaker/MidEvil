import {useEffect, useState} from "react";
import type {Game} from "@/types/Game.ts";
import {API_URL} from "@/Settings.ts";
import PlayerList from "./PlayerList.tsx";
import './Host.css';
import type {Player} from "@/types/player.ts";
import RoomCode from "./RoomCode.tsx";
import QrCode from "./QrCode.tsx";
import type { Pawn } from "@/types/Pawn.ts";

type PlayingProps = {
    gameData: Game | null;
    playerData: Player[] | null;
    pawnData: Pawn[] | null;
};

export default function Preparation({ gameData, playerData, pawnData }: PlayingProps) {
    return (
        <div>
            <div className="header">
                <h1>
                    Mid<span style={{color: "red"}}>Evil</span>
                </h1>
            </div>
            <div className="info-row">
                <PlayerList players={playerData} pawns={pawnData}/>
                <div className="join-column">
                    <RoomCode game={gameData}/>
                    <QrCode/>
                </div>
            </div>
        </div>
    );
};