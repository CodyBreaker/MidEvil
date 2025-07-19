import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { Card, CardContent } from '@/components/ui/card'
import type { Game } from '@/types/Game'
import Login from './Login'
import type { Player } from '@/types/Player'
import Joined from './Joined'
import Playing from './Playing'
import type { Pawn } from '@/types/Pawn'
import type { PawnState } from '@/types/PawnState'
import type { DieAction } from '@/types/DieAction'
import { API_URL_CLIENT } from '@/Settings'

function Join() {
    const [roomCode, setRoomCode] = useState('')
    const [userName, setUserName] = useState('')
    const [error, setError] = useState<null | string>(null)
    const [game, setGame] = useState<Game | null>(null)
    const [player, setPlayer] = useState<Player | null>(null)
    const [players, setPlayers] = useState<Player[] | null>(null)
    const [pawns, setPawns] = useState<Pawn[] | null>(null)
    const [pawnStates, setPawnStates] = useState<PawnState[] | null>(null)
    const [dieActions, setDieActions] = useState<DieAction[] | null>(null)
    const [joinState, setJoinState] = useState<string>("login")


    // On mount, check if roomCode cookie exists
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const storedUserName = localStorage.getItem('userName');
        const urlRoomCode = params.get('roomCode');

        if (storedUserName) {
            setUserName(storedUserName);
        }

        if (urlRoomCode) {
            setRoomCode(urlRoomCode);
            fetch(API_URL_CLIENT + `game.php?roomCode=${urlRoomCode}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setGame(data.game)
                        setPawns(data.pawns)
                        setPlayers(data.players)
                        setPawnStates(data.pawn_states)
                        setDieActions(data.die_actions)
                        const players: Player[] = data.players || [];
                        const playerFromDB = players.find(player => player.name === storedUserName);
                        if (storedUserName && playerFromDB) {
                            setPlayer(playerFromDB)
                            setJoinState("joined")
                            console.log("Room:", data);
                            if (data.game.state === 1) {
                                setJoinState("playing")
                            }
                            if (data.game.state === 2) {
                                setJoinState("waiting");
                            }
                        }
                    } else {
                        setError(data.message || 'Failed to join room')
                    }
                })
                .catch(() => {
                    setError('Network error.')
                })
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            fetch(API_URL_CLIENT + `game.php?roomCode=${roomCode}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setGame(data.game)
                        setPawns(data.pawns)
                        setPlayers(data.players)
                        setPawnStates(data.pawn_states)
                        setDieActions(data.die_actions)
                        if (data.game.state === 1) {
                            setJoinState("playing");
                        }
                        if (data.game.state === 2) {
                            setJoinState("waiting");
                        }
                    } else {
                        setError(data.message || "Failed to join room");
                    }
                })
                .catch(() => {
                    setError("Network error.");
                });
        }, 5000); // 5000 ms = 5 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [roomCode]);

    const handleJoinRoom = () => {
        if (!roomCode.trim()) {
            setError("Please enter a roomcode.")
            return
        }

        if (!userName.trim()) {
            setError("Please enter a username.")
            return
        }

        setError(null)

        fetch(API_URL_CLIENT + `game.php?roomCode=${roomCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.game) {
                        const existingPlayers: Player[] = data.players
                        const exists = existingPlayers.find(player => player.name === userName) ? true : false
                        if (exists) {
                            setError("Username already exists in this room.")
                            return
                        } else {
                            setGame(data.game)
                            setPawns(data.pawns)
                            setPlayers(data.players)
                            setPawnStates(data.pawn_states)
                            setDieActions(data.die_actions)
                            setJoinState("joined")
                            localStorage.setItem('userName', userName)
                            const newUrl = `${window.location.origin}${window.location.pathname}?roomCode=${roomCode}`
                            window.history.pushState({}, '', newUrl)
                            createNewPlayer(userName)
                        }
                    }
                } else {
                    setError(data.message || 'Failed to join room or add word.')
                }
            })
            .catch(() => {
                setError('Network error.')
            })
    }

    const createNewPlayer = async (username: string, color: string = 'blue') => {
        try {
            const response = await fetch(API_URL_CLIENT + 'player.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomCode: roomCode,
                    name: username,
                    color: color
                })
            })
                ;

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create player');
            }

            setPlayer(data.player);
        } catch (error) {
            console.error('Error creating new player:', error);
            throw error;
        }
    };


    const handleLeaveRoom = () => {
        setJoinState("login")
        setRoomCode('')
        setError(null)
        setGame(null)
        localStorage.removeItem('userName')
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }





    return (
        <div className="h-[90vh] w-full flex items-center justify-center bg-gray-50" style={{ fontSize: '1.8rem' }}>

            <Card className="w-full h-full flex flex-col shadow-lg rounded-none">
                <CardContent className="flex flex-col gap-6 flex-1 overflow-auto p-8" style={{ fontSize: '1.8rem' }}>
                    {joinState === "login" && (
                        <Login
                            roomCode={roomCode}
                            setRoomCode={setRoomCode}
                            userName={userName}
                            setUserName={setUserName}
                            handleJoinRoom={handleJoinRoom}
                        />
                    )}

                    {joinState === "joined" && (
                        <Joined
                            roomCode={roomCode}
                            handleLeaveRoom={handleLeaveRoom}
                            player={player}
                        />
                    )}

                    {joinState === "playing" && (
                        <Playing
                            player={player}
                            pawns={pawns}
                            pawnStates={pawnStates}
                            dieActions={dieActions}
                            players={players}
                            joinState={joinState}
                        />
                    )}
                    {joinState === "waiting" && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-600" style={{ fontSize: '1.8rem' }}>
                                Simulation in progress, look at the TV
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-600 mt-6" style={{ fontSize: '1.8rem' }}>
                            {error}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )


}


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Join />
    </StrictMode>,
)
