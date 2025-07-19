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
    swordSwings: { pawnId: number; key: string }[];
    setSwordSwings: React.Dispatch<React.SetStateAction<{ pawnId: number; key: string }[]>>;
    redSquares: number[];
    arrowAnimations: { id: number; fromIndex: number; toIndex: number }[];
}

export function BoardRenderer({
    playerCount = 12,
    pawnData,
    pawnStatesData,
    playerData,
    actionMessage,
    swordSwings,
    setSwordSwings,
    redSquares,
    arrowAnimations
}: BoardRendererProps) {
    const [board, setBoard] = useState<Board | null>(GenerateBoard(playerCount, playerData, []));

    useEffect(() => {
        setBoard(GenerateBoard(playerCount, playerData, redSquares));
    }, [playerCount, pawnData, playerData, swordSwings, redSquares]);

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
                    🍺 → 🎲1 → 🎲2 → 🎲3 → 🎲4 → 🎲5 → 🎲6 → 🛡️ → ✨ → 🎲 → ⚔️ → 🏹
                </div>
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
                            title={`Space ${index} (${space.x.toFixed(1)}, ${space.y.toFixed(1)})`}
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
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: -6,
                                                right: -6,
                                                display: 'flex',
                                                gap: 2, // optional spacing between icons
                                                fontSize: 12,
                                            }}
                                        >
                                            {hasShield && <span>🛡️</span>}
                                            {isDrunk && <span>🍺</span>}
                                        </div>
                                    )}
                                </div>

                                {arrowAnimations.map(({ id, fromIndex, toIndex }) => {
                                    console.log(arrowAnimations);
                                    const to = board.spaces[toIndex];
                                    const from = fromIndex === -1 ? { x: to.x + 5, y: to.y, color: 'transparent' } : board.spaces[fromIndex];


                                    if (!from || !to) return null;

                                    const dx = to.x - from.x;
                                    const dy = to.y - from.y;
                                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                                    const distance = Math.sqrt(dx * dx + dy * dy);

                                    return (
                                        <div
                                            key={id}
                                            style={{
                                                position: "absolute",
                                                left: from.x - minX + 50,
                                                top: from.y - minY + 50,
                                                transform: `rotate(${angle}deg)`,
                                                transformOrigin: "left center",
                                                pointerEvents: "none",
                                                zIndex: 10,
                                                height: 20,
                                                overflow: "visible"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "relative",
                                                    animation: `flyArrow ${distance / 500}s linear forwards`,
                                                    width: distance,
                                                    fontSize: 20,
                                                }}
                                            >
                                                🏹
                                            </div>
                                        </div>
                                    );
                                })}



                                {/* Sword Swing Animation */}
                                {swordSwings
                                    .filter(swing => swing.pawnId === pawn.id)
                                    .map(swing => (
                                        <div
                                            key={swing.key}
                                            style={{
                                                position: 'absolute',
                                                left: space.x - minX + 22,
                                                top: space.y - minY + 22,
                                                width: 60,
                                                height: 60,
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                                zIndex: 5,
                                                transformOrigin: '50% 50%',
                                                animation: 'sword-orbit 0.6s linear',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                            onAnimationEnd={() => {
                                                setSwordSwings(prev => prev.filter(sw => sw.key !== swing.key));
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '100%',  // place sword to the right edge of the parent div
                                                    transform: 'translate(-50%, -50%)',
                                                    fontSize: 24,
                                                }}
                                            >
                                                ⚔️
                                            </div>
                                        </div>
                                    ))}

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
