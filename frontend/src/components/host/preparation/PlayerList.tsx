import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import './preparation.css';
import type { Player } from "@/types/player.ts";
import type { Pawn } from "@/types/Pawn.ts";

function PlayerList({ players, pawns }: { players: Player[] | null, pawns: Pawn[] | null }) {
    return (
        <div className="playerlist">
            <h1>Player list:</h1>
            <Table className="players">
                <TableCaption>These guys are kind of stupid...</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]" style={{ fontWeight: "bold" }}>PlayerNr</TableHead>
                        <TableHead className="w-[200px]" style={{ fontWeight: "bold" }}>Player</TableHead>
                        <TableHead style={{ fontWeight: "bold" }}>Pawn Names</TableHead>
                        <TableHead style={{ fontWeight: "bold" }}>Status</TableHead>

                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players && players.length > 0 ? (
                        players.map((player, index) => {
                            const playerPawns = pawns?.filter(pawn => pawn.owner_id === player.id) ?? [];

                            return (
                                <TableRow key={player.id ?? index}>
                                    <TableCell className="w-[100px]">{index + 1}</TableCell>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>
                                        {playerPawns.length > 0
                                            ? playerPawns.map(p => p.pawn_name).join(', ')
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {player.is_ready ? "Ready" : "Unready"}
                                    </TableCell>
                                </TableRow>
                            );
                        })
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