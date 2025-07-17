import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
export default PlayerList;
import './Host.css'

function PlayerList() {
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
                <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>Paid</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </div>
    );
}
