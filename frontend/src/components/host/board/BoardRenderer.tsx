import { GenerateBoard } from "@/components/host/board/BoardGenerator.ts";
import { useEffect, useState } from "react";
import type { Board } from "@/types/Board.ts";
import type { CSSProperties } from "react";
import type { Pawn } from "@/types/Pawn";
import type { Player } from "@/types/Player";
import type { PawnState } from "@/types/PawnState";

interface BoardRendererProps {
    playerCount?: number;
    pawnData: Pawn[];
    pawnStatesData: PawnState[];
    playerData: Player[];
    actionMessage: string;
}

export function BoardRenderer({ playerCount = 10, pawnData, pawnStatesData, playerData, actionMessage }: BoardRendererProps) {
    const [board, setBoard] = useState<Board | null>(null);

    useEffect(() => {
        setBoard(GenerateBoard(playerCount));
    }, [playerCount, pawnData, playerData]);

    if (!board) return <div>Loading board...</div>;

    // Flatten all positions for bounds
    const allX = [
        ...board.spaces.map(s => s.x),
        ...board.bases.flat().map(s => s.x),
        ...board.homes.flat().map(s => s.x)
    ];
    const allY = [
        ...board.spaces.map(s => s.y),
        ...board.bases.flat().map(s => s.y),
        ...board.homes.flat().map(s => s.y)
    ];

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const width = maxX - minX + 100;
    const height = maxY - minY + 60;

    const commonStyle = (space: { x: number; y: number; color: string }): CSSProperties => ({
        position: 'absolute',
        left: space.x - minX + 50,
        top: space.y - minY + 50,
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: space.color,
        transform: 'translate(-50%, -50%)',
        transition: 'all 0.3s ease'
    });

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {actionMessage && (
                    <div style={{
                        marginBottom: '0px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ccc',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {actionMessage}
                    </div>
                )}

                {/* Board Container */}
                <div style={{
                    position: 'relative',
                    width: `${width}px`,
                    height: `${height}px`,
                    margin: '0px auto'
                }}>
                    {/* Spaces */}
                    {board.spaces.map((space, index) => (
                        <div
                            key={`space-${index}`}
                            style={commonStyle(space)}
                            title={`Space (${space.x.toFixed(1)}, ${space.y.toFixed(1)})`}
                        />
                    ))}

                    {/* Bases */}
                    {board.bases.map((group, groupIndex) =>
                        group.map((space, i) => (
                            <div
                                key={`base-${groupIndex}-${i}`}
                                style={{
                                    ...commonStyle(space),
                                    backgroundColor: space.color || 'blue',
                                    border: '2px solid white'
                                }}
                                title={`Base P${groupIndex} (${i})`}
                            />
                        ))
                    )}

                    {/* Homes */}
                    {board.homes.map((group, groupIndex) =>
                        group.map((space, i) => (
                            <div
                                key={`home-${groupIndex}-${i}`}
                                style={{
                                    ...commonStyle(space),
                                    backgroundColor: space.color || 'green',
                                    border: '2px solid white'
                                }}
                                title={`Home P${groupIndex} (${i})`}
                            />
                        ))
                    )}

                    {/* Pawns */}
                    {pawnData.map((pawn, index) => {
                        const player = playerData.find(p => p.id === pawn.owner_id);
                        if (!player || !player.color) return null;

                        const pawnStates = pawnStatesData.filter(s => s.pawn_id === pawn.id);
                        const hasShield = pawnStates.some(s => s.state === "shield" && s.counter > 0);
                        const isDrunk = pawnStates.some(s => s.state === "drunk" && s.counter > 0);

                        let space: { x: number; y: number } | null = null;

                        if (pawn.position >= 0) {
                            space = board.spaces[pawn.position];
                        } else if (pawn.position === -1) {
                            const baseGroup = board.bases[playerData.indexOf(player)];
                            const baseIndex = baseGroup.length - 1 -
                                pawnData.filter(p => p.owner_id === player.id && p.position === -1)
                                    .findIndex(p => p.id === pawn.id);
                            space = baseGroup[baseIndex];
                        } else if (pawn.position === -2) {
                            const homeGroup = board.homes[playerData.indexOf(player)];
                            const homeIndex =
                                pawnData.filter(p => p.owner_id === player.id && p.position === -2)
                                    .findIndex(p => p.id === pawn.id);
                            space = homeGroup[homeIndex];
                        }

                        if (!space) return null;

                        return (
                            <div key={`pawn-${pawn.id}`}>
                                {/* Pawn Circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: space.x - minX + 50,
                                        top: space.y - minY + 50,
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        backgroundColor: player.color,
                                        transform: 'translate(-50%, -50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid white',
                                        boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease',
                                        zIndex: 2
                                    }}
                                    title={`Pawn ${pawn.pawn_name} (${pawn.position})`}
                                >
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: 'white'
                                    }} />
                                    {(hasShield || isDrunk) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: -6,
                                            right: -6,
                                            fontSize: 12
                                        }}>
                                            {hasShield && "🛡️"}{isDrunk && "🍺"}
                                        </div>
                                    )}
                                </div>

                                {/* Name Tag */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: space.x - minX + 50,
                                        top: space.y - minY + 34,
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        color: player.color,
                                        backgroundColor: 'white',
                                        padding: '1px 4px',
                                        borderRadius: 4,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.2)',
                                        transform: 'translate(-50%, -50%)',
                                        whiteSpace: 'nowrap',
                                        zIndex: 1
                                    }}
                                >
                                    {pawn.pawn_name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
