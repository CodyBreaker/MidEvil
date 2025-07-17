import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { API_URL } from '@/Settings'
import type { Game } from '@/types/Game'

function Join() {
    const [roomCode, setRoomCode] = useState('')
    const [userName, setUserName] = useState('')
    const [enteredRoom, setEnteredRoom] = useState(false)
    const [error, setError] = useState<null | string>(null)
    const [game, setGame] = useState<Game | null>(null)

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
            fetch(API_URL + `game.php?roomCode=${urlRoomCode}`)
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                    if (data.success) {
                        setGame(data.game)
                        if (storedUserName) {
                            setEnteredRoom(true)
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

        fetch(API_URL + `game.php?roomCode=${roomCode}`)
            .then(res => res.json())
            .then(data => {
                console.log(data)
                if (data.success) {
                    setEnteredRoom(true)
                    localStorage.setItem('userName', userName)

                    // Update URL to include roomCode
                    const newUrl = `${window.location.origin}${window.location.pathname}?roomCode=${roomCode}`
                    window.history.pushState({}, '', newUrl)
                } else {
                    setError(data.message || 'Failed to join room or add word.')
                }
            })
            .catch(() => {
                setError('Network error.')
            })
    }

    const handleLeaveRoom = () => {
        setEnteredRoom(false)
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
                    {!enteredRoom ? (
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
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
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
                            </div>

                            <hr className="mb-6" />

                            <h3 className="font-medium mb-4" style={{ fontSize: '5rem' }}>
                                Your Words:
                            </h3>

                        </>
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
