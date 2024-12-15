import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Grid from './components/Grid';
import PlayerCount from './components/PlayerCount';
import './App.css'; // Import the global theme and styles

const socket = io('http://localhost:5000');

const App = () => {
    const [grid, setGrid] = useState([]);
    const [playerCount, setPlayerCount] = useState(0);
    const [canUpdate, setCanUpdate] = useState(true);
    const [timer, setTimer] = useState(0);
    const [history, setHistory] = useState([]);
    const [revertedGrid, setRevertedGrid] = useState(null); // Store reverted grid state

    useEffect(() => {
        // Fetch initial grid and history
        fetch('http://localhost:5000/api/grid')
            .then((res) => res.json())
            .then(setGrid);

        fetch('http://localhost:5000/api/history')
            .then((res) => res.json())
            .then(setHistory);

        // Listen for grid and history updates
        socket.on('update-grid', ({ x, y, char }) => {
            setGrid((prevGrid) => {
                const newGrid = [...prevGrid];
                newGrid[x][y] = char;
                return newGrid;
            });
        });

        socket.on('player-count', setPlayerCount);

        socket.on('update-history', (updatedHistory) => {
            setHistory(updatedHistory);
        });

        return () => {
            socket.off('update-grid');
            socket.off('player-count');
            socket.off('update-history');
        };
    }, []);

    const handleBlockClick = (x, y) => {
        if (canUpdate && grid[x][y] === null) {
            const char = prompt('Enter a Unicode character:');
            if (char) {
                socket.emit('update-block', { x, y, char });
                setCanUpdate(false);

                let remainingTime = 60;
                setTimer(remainingTime);
                const timerInterval = setInterval(() => {
                    remainingTime--;
                    setTimer(remainingTime);
                    if (remainingTime <= 0) {
                        clearInterval(timerInterval);
                        setCanUpdate(true);
                        setTimer(0);
                    }
                }, 1000);
            }
        }
    };

    const revertToUpdate = (index) => {
        // Generate grid up to a specific point in history
        const newGrid = Array(10).fill(null).map(() => Array(10).fill(null));

        for (let i = 0; i <= index; i++) {
            const group = history[i];
            group.updates.forEach(({ x, y, char }) => {
                newGrid[x][y] = char;
            });
        }

        setRevertedGrid(newGrid); // Store the reverted state
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Multiplayer Grid Game</h1>
                <p className="tagline">Collaborate, Play, and Learn with Others in Real-Time!</p>
            </header>

            <div className="game-container">
                <PlayerCount count={playerCount} />
                {timer > 0 && <p className="timer">Next move in: {timer}s</p>}
                <Grid grid={revertedGrid || grid} onBlockClick={handleBlockClick} />
            </div>

            <div className="history-container">
                <h2>Update History</h2>
                <ul>
                    {history.map((group, index) => (
                        <li key={index} className="history-item">
                            At {new Date(group.timestamp).toLocaleTimeString()}:
                            <ul>
                                {group.updates.map((update, i) => (
                                    <li key={i}>
                                        Block ({update.x}, {update.y}) updated with "{update.char}"
                                    </li>
                                ))}
                            </ul>
                            <button className="revert-button" onClick={() => revertToUpdate(index)}>Revert to this state</button>
                        </li>
                    ))}
                </ul>
            </div>

            <footer className="app-footer">
                <p>© 2024 Multiplayer Grid Game. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;
