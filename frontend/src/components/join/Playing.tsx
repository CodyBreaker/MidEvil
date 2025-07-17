import { Button } from "../ui/button";
import { Input } from "../ui/input";

type LoginProps = {
  roomCode: string;
  setRoomCode: (roomCode: string) => void;
  userName: string;
  setUserName: (userName: string) => void;
  handleJoinRoom: () => void;
};


export default function Playing({ roomCode, setRoomCode, userName, setUserName, handleJoinRoom }: LoginProps) {
  return (
        <>
            <h2 className="font-semibold text-center" style={{ fontSize: '2rem' }}>
                Enter Room Code and your username
            </h2>
            <Input
                className="py-5 uppercase"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                style={{ fontSize: '2rem', padding: '2rem' }}
            />
            <Input
                className="py-5"
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ fontSize: '2rem', padding: '2rem' }}
            />
            <Button
                variant="outline"
                className="py-5"
                style={{ fontSize: '2rem', padding: '2rem 2rem', marginTop: '2rem' }}
                onClick={handleJoinRoom}
            >
                Join Room
            </Button>
        </>
    );
}