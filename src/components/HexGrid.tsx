import React from 'react';

interface HexGridProps {
    map: { altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; climateZone: string; latitude: number; plate: number; habitability: number; features: string[]}[][];
    riverPaths: Array<{ start: [number, number]; end: [number, number]; width: number }>;
    visualizationType: string;
    plates: number;
    setTooltip: React.Dispatch<React.SetStateAction<string | null>>;
    showFeatures: boolean; // New prop for toggling features
}

const HexGrid: React.FC<HexGridProps> = ({ map, visualizationType, plates, setTooltip, showFeatures }) => {
    const hexWidth = 50;
    const hexHeight = Math.sqrt(3) / 2 * hexWidth;

    const getHexCenter = (row: number, col: number): [number, number] => {
        const x = col * (hexWidth * 0.75);
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        return [x, y];
    };

    const getFillColor = (tile: { altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; plate: number; habitability: number; climateZone: string }): string => {
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
            case 'habitability':
                const habitabilityColor = Math.floor(tile.habitability * 255);
                return `rgb(${255 - habitabilityColor}, ${habitabilityColor}, 0)`; // Red to green gradient
            case 'climate':
                const climateColors: Record<string, string> = {
                    equatorial: '#228B22', // Forest green
                    'tropical monsoon': '#32CD32', // Lime green
                    'tropical dry': '#FFD700', // Gold
                    mediterranean: '#F4A460', // Sandy brown
                    'sub-tropical dry': '#D2B48C', // Tan
                    'temperate maritime': '#87CEEB', // Sky blue
                    'temperate continental': '#4682B4', // Steel blue
                    'sub-polar': '#ADD8E6', // Light blue
                    polar: '#FFFFFF', // White
                    unknown: '#808080', // Gray
                };
                return climateColors[tile.climateZone] || '#808080'; // Default to gray
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
                {map.map((row, rowIndex) =>
                    row.map((tile, colIndex) => {
                        const [x, y] = getHexCenter(rowIndex, colIndex);

                        // Build the tooltip description
                        const tileDescription = `
                            Coordinates: (${colIndex}, ${rowIndex})
                            Plate: ${tile.plate}
                            Altitude: ${tile.altitude.toFixed(2)}
                            Temperature: ${tile.temperature.toFixed(2)}
                            Humidity: ${tile.humidity.toFixed(2)}
                            Vegetation: ${tile.vegetation.toFixed(2)}
                            Habitability: ${tile.habitability.toFixed(2)}
                            Latitude: ${tile.latitude.toFixed(2)}
                            Biome: ${tile.terrain}
                            Climate Zone: ${tile.climateZone}
                            ${showFeatures && tile.features.length > 0 ? `Features: ${tile.features.join(', ')}` : ''}
                        `.trim();

                        return (
                            <g key={`${rowIndex}-${colIndex}`}>
                                {/* Hexagon */}
                                <polygon
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
                                    onMouseEnter={() => setTooltip(tileDescription)}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                                {showFeatures && tile.features.includes('source') && (
                                    <image
                                        href="/icons/source-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {showFeatures && tile.features.includes('river') && (
                                    <image
                                        href="/icons/river-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {showFeatures && tile.features.includes('lake') && (
                                    <image
                                        href="/icons/lake-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {showFeatures && tile.features.includes('volcano') && (
                                    <image
                                        href="/icons/volcano-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {showFeatures && tile.features.includes('village') && (
                                    <image
                                        href="/icons/village-icon.svg" // Replace with the path to your village icon
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {showFeatures && tile.features.includes('city') && (
                                    <image
                                        href="/icons/city-icon.svg" // Replace with the path to your city icon
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)} // Use tile's tooltip
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                            </g>
                        );
                    })
                )}
            </svg>
        </div>
    );
};

export default HexGrid;