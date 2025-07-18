import {GenerateBoard} from "@/components/host/board/BoardGenerator.ts";
import {useEffect, useState} from "react";
import type {Board} from "@/types/Board.ts";

export function BoardRenderer({playerCount = 10}: { playerCount?: number }) {
    const [board, setBoard] = useState<Board | null>(null);

    useEffect(() => {
        setBoard(GenerateBoard(playerCount));
    }, [playerCount]);

    if (!board) return <div>Loading board...</div>;

    // Calculate view bounds with padding
    const allX = board.spaces.map(s => s.x);
    const allY = board.spaces.map(s => s.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const width = maxX - minX + 100;
    const height = maxY - minY + 100;

    return (
        <div style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            margin: '20px auto'
        }}>
            {board.spaces.map((space, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        left: `${space.x - minX + 50}px`,
                        top: `${space.y - minY + 50}px`,
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: space.color,
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.3s ease'
                    }}
                    title={`(${space.x.toFixed(1)}, ${space.y.toFixed(1)})`}
                />
            ))}
        </div>
    );
}