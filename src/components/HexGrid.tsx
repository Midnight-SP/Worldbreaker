import React, { useState } from 'react';

interface HexGridProps {
    map: { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; plate: number }[][];
    visualizationType: string;
    plates: number;
    setTooltip: React.Dispatch<React.SetStateAction<string | null>>; // Add setTooltip prop
}

const HexGrid: React.FC<HexGridProps> = ({ map, visualizationType, plates, setTooltip }) => {
    if (!map || map.length === 0) {
        return <div>No map data available</div>; // Fallback if map is empty
    }

    const hexWidth = 50; // Width of a hexagon
    const hexHeight = Math.sqrt(3) / 2 * hexWidth; // Height of a hexagon

    // Calculate the total width and height of the map
    const mapWidth = map[0].length * hexWidth * 0.75; // Horizontal space
    const mapHeight = map.length * hexHeight + hexHeight / 2; // Vertical space

    const getHexPoints = (x: number, y: number): string => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + hexWidth / 2 * Math.cos(angle);
            const py = y + hexWidth / 2 * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        return points.join(' ');
    };

    const getFillColor = (tile: { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; plate: number }): string => {
        switch (visualizationType) {
            case 'altitude':
                const altitudeColor = Math.floor((tile.altitude + 1) * 127.5); // Map altitude (-1 to 1) to RGB (0 to 255)
                return `rgb(${altitudeColor}, ${altitudeColor}, ${altitudeColor})`;
            case 'temperature':
                const temperatureColor = Math.floor((tile.temperature + 1) * 127.5); // Map temperature (-1 to 1) to RGB (0 to 255)
                return `rgb(${temperatureColor}, 0, ${255 - temperatureColor})`;
            case 'humidity':
                const humidityColor = Math.floor(tile.humidity * 255); // Map humidity (0 to 1) to RGB (0 to 255)
                return `rgb(0, ${humidityColor}, ${255 - humidityColor})`;
            case 'plates':
                return `hsl(${tile.plate * (360 / plates)}, 70%, 50%)`; // Assign color based on plate
            case 'biomes':
            default:
                return ''; // Use CSS classes for biomes
        }
    };

    const handleMouseEnter = (tile: { altitude: number; temperature: number; humidity: number; terrain: string; plate: number }) => {
        const tooltipContent = `Biome: ${tile.terrain}\nAltitude: ${tile.altitude.toFixed(2)}\nTemperature: ${tile.temperature.toFixed(2)}\nHumidity: ${tile.humidity.toFixed(2)}\nPlate: ${tile.plate}`;
        setTooltip(tooltipContent); // Update tooltip in App
    };

    const handleMouseLeave = () => {
        setTooltip(null); // Clear tooltip in App
    };

    return (
        <div className="hex-grid">
            <svg
                viewBox={`-${hexWidth / 2} -${hexHeight / 2} ${mapWidth + hexWidth} ${mapHeight + hexHeight}`}
            >
                {map.map((row, rowIndex) =>
                    row.map((tile, colIndex) => {
                        // Calculate the position of each hexagon
                        const x = colIndex * (hexWidth * 0.75); // Horizontal offset
                        const y = rowIndex * hexHeight + (colIndex % 2 === 0 ? 0 : hexHeight / 2); // Vertical offset

                        return (
                            <polygon
                                key={`${rowIndex}-${colIndex}`}
                                points={getHexPoints(x, y)}
                                className={`hex-tile ${visualizationType === 'biomes' ? tile.terrain : ''}`}
                                fill={visualizationType !== 'biomes' ? getFillColor(tile) : undefined}
                                onMouseEnter={() => handleMouseEnter(tile)}
                                onMouseLeave={handleMouseLeave}
                            />
                        );
                    })
                )}
            </svg>
        </div>
    );
};

export default HexGrid;