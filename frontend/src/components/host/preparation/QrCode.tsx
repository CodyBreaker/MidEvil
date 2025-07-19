import QRCode from 'react-qr-code';
import './preparation.css';
import type { Player } from '@/types/Player';
import type { Game } from '@/types/Game';

function QrCode( { playerData, gameData }: { playerData: Player[] | null, gameData: Game | null }) {
    return (
        <div className="qrcode">
            <h1 style={{fontSize:"200%", marginBottom:"5%" }}>Or scan the Qr-Code:</h1>
            {playerData && playerData.length >= 2 ? (
                <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "50%" }}
                    value={"https://tools.oles.nl/midevil/?roomCode=" + gameData?.room_code}
                    viewBox={`0 0 256 256`}
                />
            ) : (
                <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "50%" }}
                    value={"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
                    viewBox={`0 0 256 256`}
                />
            )}
        </div>
    );
}

export default QrCode;