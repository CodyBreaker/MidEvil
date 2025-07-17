import type { Player } from "@/types/player";
import { Button } from "../ui/button";


type JoinedProps = {
  roomCode: string;
  handleLeaveRoom: () => void;
  player: Player | null;
};

export default function Joined({ roomCode, handleLeaveRoom, player }: JoinedProps) {
    console.log("Joined component rendered with player:", player);
    return (
        <><div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold" style={{ fontSize: '2.5rem' }}>
                Room: <span className="text-blue-600 uppercase">{roomCode}</span>
            </h2>
            <Button
                variant={"outline"}
                style={{ fontSize: '1.8rem', padding: '2rem 2rem' }}
                onClick={handleLeaveRoom}
            >
                Leave
            </Button>
        </div><hr className="mb-6" /></>
    );
}