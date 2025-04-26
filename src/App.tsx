import React, { useState, useEffect, useRef } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator';
import './styles/App.css';
import { calculateWorldStats } from './utils/mapGenerator/calculateWorldStats';

const App: React.FC = () => {
    const [map, setMap] = useState<Array<Array<{ altitude: number; temperature: number; humidity: number; vegetation: number; habitability: number; terrain: string; latitude: number; plate: number; features: string[]}>> | null>(null);
    const [riverPaths, setRiverPaths] = useState<Array<{ start: [number, number]; end: [number, number]; width: number }>>([]);
    const [width, setWidth] = useState<number>(100);
    const [height, setHeight] = useState<number>(80);
    const [plates, setPlates] = useState<number>(7);
    const [visualizationType, setVisualizationType] = useState<string>('biomes');
    const [tooltip, setTooltip] = useState<string | null>(null);
    const [mapPosition, setMapPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [showFeatures, setShowFeatures] = useState<boolean>(true);
    const [latitudeMode, setLatitudeMode] = useState<'full' | 'partial'>('full');

    const mapWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Validation: Ensure width and height are valid
        if (!width || !height || width < 10 || height < 5) {
            console.warn('Invalid dimensions. Width must be at least 10 and height must be at least 5.');
            return; // Do not generate a new map
        }
    
        const { map: newMap, riverPaths: newRiverPaths } = generateMap(width, height, plates, latitudeMode);
        console.log('Generated map with new latitude mode:', latitudeMode);
        setMap(newMap);
        setRiverPaths(newRiverPaths);
    }, [latitudeMode, width, height, plates]);

    useEffect(() => {
        const mapWrapper = mapWrapperRef.current;

        if (!mapWrapper) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // Prevent the page from scrolling
            setZoom((prevZoom) => {
                const newZoom = prevZoom - e.deltaY * 0.001; // Adjust zoom sensitivity
                return Math.min(Math.max(newZoom, 0.5), 3); // Clamp zoom between 50% and 300%
            });
        };

        mapWrapper.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            mapWrapper.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handleGenerateMap = () => {
        if (width <= 0 || height <= 0 || plates <= 0) {
            console.warn('Width, height, and plate count must be greater than 0.');
            return; // Do not generate a new map
        }
    
        try {
            const { map: newMap, riverPaths: newRiverPaths } = generateMap(width, height, plates, latitudeMode);
            setMap(newMap);
            setRiverPaths(newRiverPaths);
        } catch (error) {
            console.error('Failed to generate map:', error);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const initialPosition = { ...mapPosition };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            setMapPosition({
                x: initialPosition.x + deltaX,
                y: initialPosition.y + deltaY,
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleWidthChange = (newWidth: number | string) => {
        const parsedWidth = parseInt(newWidth as string, 10);
        setWidth(isNaN(parsedWidth) ? 0 : parsedWidth); // Set to 0 if the input is invalid
    };
    
    const handleHeightChange = (newHeight: number | string) => {
        const parsedHeight = parseInt(newHeight as string, 10);
        setHeight(isNaN(parsedHeight) ? 0 : parsedHeight); // Set to 0 if the input is invalid
    };

    const handlePlatesChange = (newPlates: number | string) => {
        const parsedPlates = parseInt(newPlates as string, 10);
        setPlates(isNaN(parsedPlates) ? 0 : parsedPlates); // Default to 1 if invalid
    };

    return (
        <div className="App">
            <header className="header">
                <h1>Worldbreaker: Procedurally Generated Hexagonal Map</h1>
                <div className="controls">
                    <label>
                        Width:
                        <input
                            type="number"
                            value={width || ''} // Show an empty string if width is 0
                            onChange={(e) => handleWidthChange(e.target.value)}
                        />
                    </label>
                    <label>
                        Height:
                        <input
                            type="number"
                            value={height || ''} // Show an empty string if height is 0
                            onChange={(e) => handleHeightChange(e.target.value)}
                        />
                    </label>
                    <label>
                        Tectonic Plates:
                        <input
                            type="number"
                            value={plates || ''} // Show an empty string if plates is 0 or invalid
                            onChange={(e) => handlePlatesChange(e.target.value)}
                        />
                    </label>
                    <button 
                        onClick={handleGenerateMap} 
                        disabled={width <= 0 || height <= 0} // Disable button if dimensions are invalid
                    >
                        Generate Map
                    </button>
                    <label>
                        Visualization:
                        <select
                            value={visualizationType}
                            onChange={(e) => setVisualizationType(e.target.value)}
                        >
                            <option value="biomes">Biomes</option>
                            <option value="altitude">Altitude</option>
                            <option value="temperature">Temperature</option>
                            <option value="humidity">Humidity</option>
                            <option value="vegetation">Vegetation</option>
                            <option value="habitability">Habitability</option>
                            <option value="plates">Tectonic Plates</option>
                        </select>
                    </label>
                    <label>
                        Show Features:
                        <input
                            type="checkbox"
                            checked={showFeatures}
                            onChange={(e) => setShowFeatures(e.target.checked)}
                        />
                    </label>
                    <label>
                        Latitude Mode:
                        <select
                            value={latitudeMode}
                            onChange={(e) => setLatitudeMode(e.target.value === 'full' ? 'full' : 'partial')}
                        >
                            <option value="full">Full (1 to -1)</option>
                            <option value="partial">Partial (1 to 0)</option>
                        </select>
                    </label>
                </div>
                <div className="world-info">
                    {map && (
                        <>
                            <div className="info-item">
                                <label>Average Altitude</label>
                                <p>{calculateWorldStats(map).averageAltitude.toFixed(2)}</p>
                            </div>
                            <div className="info-item">
                                <label>Average Temperature</label>
                                <p>{calculateWorldStats(map).averageTemperature.toFixed(2)}</p>
                            </div>
                            <div className="info-item">
                                <label>Average Humidity</label>
                                <p>{calculateWorldStats(map).averageHumidity.toFixed(2)}</p>
                            </div>
                            <div className="info-item">
                                <label>Average Vegetation</label>
                                <p>{calculateWorldStats(map).averageVegetation.toFixed(2)}</p>
                            </div>
                            <div className="info-item">
                                <label>Average Habitability</label>
                                <p>{calculateWorldStats(map).averageHabitability.toFixed(2)}</p>
                            </div>
                            <div className="info-item">
                                <label>Ocean Coverage</label>
                                <p>{calculateWorldStats(map).oceanCoverage.toFixed(2)}%</p>
                            </div>
                            <div className="info-item">
                                <label>Sources</label>
                                <p>{calculateWorldStats(map).sourceCount}</p>
                            </div>
                            <div className="info-item">
                                <label>Lakes</label>
                                <p>{calculateWorldStats(map).lakeCount}</p>
                            </div>
                            <div className="info-item">
                                <label>Volcanoes</label>
                                <p>{calculateWorldStats(map).volcanoCount}</p>
                            </div>
                            <div className="info-item">
                                <label>Villages</label>
                                <p>{calculateWorldStats(map).villageCount}</p>
                            </div>
                            <div className="info-item">
                                <label>Cities</label>
                                <p>{calculateWorldStats(map).cityCount}</p>
                            </div>
                            <div className="info-item">
                                <label>Top 3 Biomes</label>
                                <ul>
                                    {calculateWorldStats(map).topBiomes.map(({ biome, percentage }) => (
                                        <li key={biome}>
                                            {biome}: {percentage}%
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </header>
            <div
                className="map-wrapper"
                ref={mapWrapperRef}
                onMouseDown={handleMouseDown}
                style={{
                    transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                }}
            >
                {map && (
                    <HexGrid
                        map={map}
                        riverPaths={showFeatures ? riverPaths : []} // Conditionally pass river paths
                        visualizationType={visualizationType}
                        plates={plates}
                        setTooltip={setTooltip}
                        showFeatures={showFeatures} // Pass the new prop
                    />
                )}
            </div>
            {tooltip && (
                <div className="tooltip-container">
                    <div className="tooltip">{tooltip}</div>
                </div>
            )}
        </div>
    );
};

export default App;