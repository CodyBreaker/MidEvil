import './Host.css';
import type {Game} from "@/types/Game.ts";

function RoomCode({game}: {game: Game | null}) {
    return (
        <div className="roomcode uppercase">
            <h1>ROOM CODE:</h1>
            <h2>{game?.room_code}</h2>
        </div>
    )
}

export default RoomCode;