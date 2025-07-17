import './Host.css';
import QRCode from "react-qr-code";

function QrCode() {
    return (
        <div className="qrcode">
            <QRCode
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "50%" }}
                value={"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
                viewBox={`0 0 256 256`}
            />
        </div>
    );
}

export default QrCode;