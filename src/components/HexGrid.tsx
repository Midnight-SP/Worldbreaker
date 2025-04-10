import React, { useState } from 'react';

interface HexGridProps {
    map: { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }[][];
    visualizationType: string;
    continents: number;
}

const HexGrid: React.FC<HexGridProps> = ({ map, visualizationType, continents }) => {
    const [tooltip, setTooltip] = useState<string | null>(null);

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

    const getFillColor = (tile: { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }): string => {
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
            case 'continents':
                const randomColor = `hsl(${tile.continent * (360 / continents)}, 70%, 50%)`; // Assign random color based on continent
                return randomColor;
            case 'biomes':
            default:
                return ''; // Use CSS classes for biomes
        }
    };

    const handleMouseEnter = (
        tile: { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }
    ) => {
        setTooltip(
            `Biome: ${tile.terrain}\nAltitude: ${tile.altitude.toFixed(2)}\nTemperature: ${tile.temperature.toFixed(2)}\nHumidity: ${tile.humidity.toFixed(2)}\nLatitude: ${tile.latitude.toFixed(2)}\nContinent: ${tile.continent}`
        );
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg
                className="hex-grid"
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
            {tooltip && (
                <div
                    className="tooltip-below"
                    style={{
                        position: 'relative',
                        marginTop: '20px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        whiteSpace: 'pre-line',
                        textAlign: 'center',
                    }}
                >
                    {tooltip}
                </div>
            )}
        </div>
    );
};

export default HexGrid;