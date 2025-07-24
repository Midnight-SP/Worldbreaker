import React, { useMemo } from 'react';
import { Map, Tile } from '../utils/mapGenerator/types';
import { identifyLandmasses } from '../utils/mapGenerator/landmasses';

interface HexGridProps {
    map: Map;
    visualizationType: string;
    plates: number;
    setTooltip: React.Dispatch<React.SetStateAction<string | null>>;
    showNaturalFeatures: boolean;
    showManmadeFeatures: boolean;
}

const HexGrid: React.FC<HexGridProps> = ({ 
    map, 
    visualizationType, 
    plates, 
    setTooltip, 
    showNaturalFeatures, 
    showManmadeFeatures 
}) => {
    const hexWidth = 20;
    const hexHeight = 20;

    // Define natural and manmade features
    const naturalFeatures = ['source', 'lake', 'river', 'volcano'];
    const manmadeFeatures = ['village', 'city'];

    // Memoize landmass identification to avoid recalculating on every render
    const landmassMap = useMemo(() => {
        if (visualizationType === 'landmasses') {
            return identifyLandmasses(map);
        }
        return null;
    }, [map, visualizationType]);

    // Helper function to check if a feature should be shown
    const shouldShowFeature = (feature: string): boolean => {
        if (naturalFeatures.includes(feature)) {
            return showNaturalFeatures;
        }
        if (manmadeFeatures.includes(feature)) {
            return showManmadeFeatures;
        }
        return false;
    };

    // Helper function to get filtered features for tooltip
    const getVisibleFeatures = (features: string[]): string[] => {
        return features.filter(feature => shouldShowFeature(feature));
    };

    const getHexCenter = (row: number, col: number): [number, number] => {
        const x = col * (hexWidth * 0.75);
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        return [x, y];
    };

    const getFillColor = (tile: Tile, row?: number, col?: number): string => {
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
                return `rgb(${255 - habitabilityColor}, ${habitabilityColor}, 0)`;
            case 'landmasses':
                if (landmassMap && row !== undefined && col !== undefined) {
                    const landmassTile = landmassMap[row][col];
                    if (landmassTile.landmassId !== undefined) {
                        // Generate a unique color for each landmass
                        const hue = (landmassTile.landmassId * 137.5) % 360; // Golden angle for good color distribution
                        return `hsl(${hue}, 70%, 55%)`;
                    } else {
                        // Ocean/water tiles - use a blue color
                        return '#2E8B57'; // Sea green for ocean
                    }
                }
                return '#2E8B57'; // Default ocean color
            case 'climate':
                const climateColors: Record<string, string> = {
                    equatorial: '#228B22',
                    'tropical monsoon': '#32CD32',
                    'tropical dry': '#FFD700',
                    mediterranean: '#F4A460',
                    'sub-tropical dry': '#D2B48C',
                    'temperate maritime': '#87CEEB',
                    'temperate continental': '#4682B4',
                    'sub-polar': '#ADD8E6',
                    polar: '#FFFFFF',
                    unknown: '#808080',
                };
                return climateColors[tile.climateZone] || '#808080';
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
                        
                        // Get visible features for tooltip
                        const visibleFeatures = getVisibleFeatures(tile.features);

                        // Get landmass ID for tooltip if in landmasses mode
                        let landmassInfo = '';
                        if (visualizationType === 'landmasses' && landmassMap) {
                            const landmassTile = landmassMap[rowIndex][colIndex];
                            if (landmassTile.landmassId !== undefined) {
                                landmassInfo = `Landmass ID: ${landmassTile.landmassId}`;
                            } else {
                                landmassInfo = 'Water';
                            }
                        }

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
                            ${landmassInfo ? landmassInfo : ''}
                            ${visibleFeatures.length > 0 ? `Features: ${visibleFeatures.join(', ')}` : ''}
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
                                    fill={visualizationType !== 'biomes' ? getFillColor(tile, rowIndex, colIndex) : undefined}
                                    onMouseEnter={() => setTooltip(tileDescription)}
                                    onMouseLeave={() => setTooltip(null)}
                                />

                                {/* Natural Features */}
                                {shouldShowFeature('source') && tile.features.includes('source') && (
                                    <image
                                        href="/icons/source-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {shouldShowFeature('river') && tile.features.includes('river') && (
                                    <image
                                        href="/icons/river-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {shouldShowFeature('lake') && tile.features.includes('lake') && (
                                    <image
                                        href="/icons/lake-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {shouldShowFeature('volcano') && tile.features.includes('volcano') && (
                                    <image
                                        href="/icons/volcano-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}

                                {/* Manmade Features */}
                                {shouldShowFeature('village') && tile.features.includes('village') && (
                                    <image
                                        href="/icons/village-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                )}
                                {shouldShowFeature('city') && tile.features.includes('city') && (
                                    <image
                                        href="/icons/city-icon.svg"
                                        x={x - hexWidth / 4}
                                        y={y - hexHeight / 4}
                                        width={hexWidth / 2}
                                        height={hexHeight / 2}
                                        onMouseEnter={() => setTooltip(tileDescription)}
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