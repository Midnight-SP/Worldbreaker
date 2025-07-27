import React from 'react';
import { Map, Tile } from '../utils/mapGenerator/types';
import { getRegionColor } from '../utils/mapGenerator/geographicRegions';

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
    const manmadeFeatures = ['village', 'town', 'city'];

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

    // Helper function to get feature names
    const getFeatureNames = (tile: Tile): string[] => {
        const featureNames: string[] = [];
        
        // Check each feature and add its name if it exists
        if (tile.features.includes('source') && tile.sourceName) {
            featureNames.push(`Source: ${tile.sourceName}`);
        }
        if (tile.features.includes('river') && tile.riverName) {
            featureNames.push(`River: ${tile.riverName}`);
        }
        if (tile.features.includes('lake') && tile.lakeName) {
            featureNames.push(`Lake: ${tile.lakeName}`);
        }
        if (tile.features.includes('volcano') && tile.volcanoName) {
            featureNames.push(`Volcano: ${tile.volcanoName}`);
        }
        if (tile.features.includes('village') && tile.villageName) {
            featureNames.push(`Village: ${tile.villageName}`);
        }
        if (tile.features.includes('town') && tile.townName) {
            featureNames.push(`Town: ${tile.townName}`);
        }
        if (tile.features.includes('city') && tile.cityName) {
            featureNames.push(`City: ${tile.cityName}`);
        }
        
        // Add unnamed features
        const unnamedFeatures = tile.features.filter(feature => {
            const hasName = 
                (feature === 'source' && tile.sourceName) ||
                (feature === 'river' && tile.riverName) ||
                (feature === 'lake' && tile.lakeName) ||
                (feature === 'volcano' && tile.volcanoName) ||
                (feature === 'village' && tile.villageName) ||
                (feature === 'town' && tile.townName) ||
                (feature === 'city' && tile.cityName);
            return !hasName;
        });
        
        if (unnamedFeatures.length > 0) {
            featureNames.push(...unnamedFeatures.map(f => f.charAt(0).toUpperCase() + f.slice(1)));
        }
        
        return featureNames;
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
            case 'geographic-regions':
                if (tile.regionId !== undefined && tile.regionType) {
                    return getRegionColor(tile.regionId, tile.regionType);
                }
                return '#404040'; // Default gray for unassigned regions
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
                {map.map((row: Tile[], rowIndex: number) =>
                    row.map((tile: Tile, colIndex: number) => {
                        const [x, y] = getHexCenter(rowIndex, colIndex);

                        // Get visible features for tooltip
                        const visibleFeatures = getVisibleFeatures(tile.features);
                        
                        // Get feature names
                        const featureNames = getFeatureNames(tile);

                        // Get geographic region info for tooltip
                        let regionInfo = '';
                        if (tile.regionId !== undefined && tile.regionType && tile.regionName) {
                            regionInfo = `${tile.regionName}`;
                        } else if (tile.regionId !== undefined && tile.regionType) {
                            regionInfo = `${tile.regionType.charAt(0).toUpperCase() + tile.regionType.slice(1)} ${tile.regionId}`;
                        } else {
                            regionInfo = 'Unassigned Region';
                        }

                        // Get plate name
                        const plateName = tile.plateName || `Plate ${tile.plate}`;

                        // Build the tooltip description with names
                        const tileDescription = `📍 Coordinates: (${colIndex}, ${rowIndex})
🏔️ Plate: ${plateName}
🌍 Region: ${regionInfo}
⛰️ Altitude: ${tile.altitude.toFixed(2)}
🌡️ Temperature: ${tile.temperature.toFixed(2)}
💧 Humidity: ${tile.humidity.toFixed(2)}
🌿 Vegetation: ${tile.vegetation.toFixed(2)}
🏠 Habitability: ${tile.habitability.toFixed(2)}
🌐 Latitude: ${tile.latitude.toFixed(2)}
🌱 Biome: ${tile.terrain.replace(/-/g, ' ')}
🌤️ Climate: ${tile.climateZone}${featureNames.length > 0 ? `\n\n🏞️ Features:\n${featureNames.map(name => `• ${name}`).join('\n')}` : ''}`;

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

                                {/* Feature Icons */}
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
                                {shouldShowFeature('town') && tile.features.includes('town') && (
                                    <image
                                        href="/icons/town-icon.svg"
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