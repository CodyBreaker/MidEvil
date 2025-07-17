import { Button } from "../ui/button";
import { Input } from "../ui/input";

type LoginProps = {
  roomCode: string;
  setRoomCode: (roomCode: string) => void;
  userName: string;
  setUserName: (userName: string) => void;
  handleJoinRoom: () => void;
};


export default function Login({ roomCode, setRoomCode, userName, setUserName, handleJoinRoom }: LoginProps) {
  return (
        <>
            <h2 className="font-semibold text-center" style={{ fontSize: '5rem' }}>
                Enter Room Code and your First Word
            </h2>
            <Input
                className="py-5 uppercase"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                style={{ fontSize: '3rem', padding: '3rem' }}
            />
            <Input
                className="py-5"
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ fontSize: '3rem', padding: '3rem' }}
            />
            <Button
                variant="outline"
                className="py-5"
                style={{ fontSize: '3rem', padding: '3rem 3rem', marginTop: '3rem' }}
                onClick={handleJoinRoom}
            >
                Join Room
            </Button>
        </>
    );
}