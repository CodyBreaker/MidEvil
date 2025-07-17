import { useEffect, useState } from "react";
import type {Game} from "@/types/Game.ts";
import {API_URL} from "@/Settings.ts";
import PlayerList from "./PlayerList.tsx";
import './Host.css';


const Host = () => {
    const [gameData, setGameData] = useState<Game | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(API_URL + 'game.php')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data: Game) => {
                setGameData(data);
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
                    Mid<span style={{ color:"red" }}>Evil</span>
                </h1>
            </div>
            <div className="data-loading">
                <h2>Game Info</h2>
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                {gameData ? (
                    <>
                        <pre>{JSON.stringify(gameData, null, 2)}</pre>
                        <pre>{gameData.players[1].id}</pre>
                    </>
                ) : (
                    <p>Loading game data...</p>
                )}
            </div>
            <PlayerList />
        </div>
    );
};

export default Host;