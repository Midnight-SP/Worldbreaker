import React from 'react';

interface HexGridProps {
    map: { altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; plate: number; hasRiver: boolean }[][];
    riverPaths: Array<{ start: [number, number]; end: [number, number] }>;
    visualizationType: string;
    plates: number;
    setTooltip: React.Dispatch<React.SetStateAction<string | null>>;
}

const HexGrid: React.FC<HexGridProps> = ({ map, riverPaths, visualizationType, plates, setTooltip }) => {
    if (!map || map.length === 0) {
        return <div>No map data available</div>;
    }

    const hexWidth = 50;
    const hexHeight = Math.sqrt(3) / 2 * hexWidth;

    const getHexCenter = (row: number, col: number): [number, number] => {
        const x = col * (hexWidth * 0.75);
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        return [x, y];
    };

    const getFillColor = (tile: { altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; plate: number; hasRiver: boolean }): string => {
        switch (visualizationType) {
            case 'altitude':
                const altitudeColor = Math.floor((tile.altitude + 1) * 127.5);
                return `rgb(${altitudeColor}, ${altitudeColor}, ${altitudeColor})`;
            case 'temperature':
                const temperatureColor = Math.floor((tile.temperature + 1) * 127.5);
                return `rgb(${temperatureColor}, 0, ${255 - temperatureColor})`;
            case 'humidity':
                const humidityColor = Math.floor(tile.humidity * 255);
                return `rgb(0, ${humidityColor}, ${255 - humidityColor})`;
            case 'vegetation':
                const vegetationColor = Math.floor(tile.vegetation * 255);
                return `rgb(${vegetationColor}, ${255 - vegetationColor}, 0)`;
            case 'plates':
                return `hsl(${tile.plate * (360 / plates)}, 70%, 50%)`;
            case 'biomes':
            default:
                return '';
        }
    };

    return (
        <div className="hex-grid">
            <svg
                viewBox={`-${hexWidth / 2} -${hexHeight / 2} ${map[0].length * hexWidth * 0.75 + hexWidth} ${map.length * hexHeight + hexHeight}`}
            >
                {/* Draw hexagons */}
                {map.map((row, rowIndex) =>
                    row.map((tile, colIndex) => {
                        const [x, y] = getHexCenter(rowIndex, colIndex);

                        return (
                            <polygon
                                key={`${rowIndex}-${colIndex}`}
                                points={`
                                    ${x + hexWidth / 2},${y}
                                    ${x + hexWidth / 4},${y + hexHeight / 2}
                                    ${x - hexWidth / 4},${y + hexHeight / 2}
                                    ${x - hexWidth / 2},${y}
                                    ${x - hexWidth / 4},${y - hexHeight / 2}
                                    ${x + hexWidth / 4},${y - hexHeight / 2}
                                `}
                                className={`hex-tile ${visualizationType === 'biomes' ? tile.terrain : ''}`}
                                fill={visualizationType !== 'biomes' ? getFillColor(tile) : undefined}
                                onMouseEnter={() => setTooltip(`Altitude: ${tile.altitude.toFixed(2)}`)}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        );
                    })
                )}

                {/* Draw rivers */}
                {riverPaths.map(({ start, end }, index) => {
                    const [startX, startY] = getHexCenter(start[0], start[1]);
                    const [endX, endY] = getHexCenter(end[0], end[1]);

                    return (
                        <line
                            key={index}
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke="blue"
                            strokeWidth="2"
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export default HexGrid;