import {useEffect, useState} from "react";
import type {Game} from "@/types/Game.ts";
import {API_URL} from "@/Settings.ts";
import PlayerList from "./PlayerList.tsx";
import './Host.css';
import type {Player} from "@/types/player.ts";
import RoomCode from "./RoomCode.tsx";
import QrCode from "./QrCode.tsx";


const Host = () => {
    const [gameData, setGameData] = useState<Game | null>(null);
    const [playerData, setPlayerData] = useState<Player[] | null>(null);
    const [pawnData, setPawnData] = useState<Pawn[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(API_URL + 'game.php?roomCode=stinky')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setGameData(data.game);
                setPlayerData(data.players);
                setPawnData(data.pawns);
                console.log(data);
            })
            .catch((err) => {
                console.error('Fetch error:', err);
                setError(err.message);
            });
    }, []); // Empty dependency array to run once on mount

    return (
        <div>
            <div className="header">
                <h1>
                    Mid<span style={{color: "red"}}>Evil</span>
                </h1>
            </div>
            <div className="info-row">
                <PlayerList players={playerData}/>
                <div className="join-column">
                    <RoomCode game={gameData}/>
                    < br/>
                    <QrCode/>
                </div>
            </div>
        </div>
    );
};

export default Host;