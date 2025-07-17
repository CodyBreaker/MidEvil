import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import './Host.css'
import type {Player} from "@/types/Player.ts";

function PlayerList({ players }: { players: Player[] | null }) {
    console.log(players);
    return (
    <div className="playerlist">
        <h1>Player list:</h1>
        <Table className="players">
            <TableCaption>These guys are kind of stupid...</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">PlayerNr</TableHead>
                    <TableHead >Player</TableHead>
                    <TableHead >Pawn Names</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {players && players.length > 0 ? (
                    players.map((player, index) => (
                        <TableRow key={player.id ?? index}>
                            <TableCell className="w-[100px]">{index + 1}</TableCell>
                            <TableCell>{player.name}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3}>No players connected</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
    );
}

export default PlayerList;