import type {Game} from "@/types/Game.ts";
import './preparation.css';
import type {Player} from "@/types/Player";
import type { Pawn } from "@/types/Pawn.ts";
import RoomCode from "./RoomCode.tsx";
import PlayerList from "./PlayerList.tsx";
import QrCode from "./QrCode.tsx";

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
                    <QrCode playerData={playerData} gameData={gameData} />
                </div>
            </div>
        </div>
    );
};