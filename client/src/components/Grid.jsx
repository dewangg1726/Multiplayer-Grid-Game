import React from 'react';
import './Grid.css'; 

const Grid = ({ grid, onBlockClick }) => {
    return (
        <div className="grid-container">
            {grid.map((row, x) =>
                row.map((char, y) => (
                    <div
                        key={`${x}-${y}`}
                        onClick={() => onBlockClick(x, y)}
                        className={`grid-block ${char ? 'selected' : ''}`}
                    >
                        {char || ''}
                    </div>
                ))
            )}
        </div>
    );
};

export default Grid;
