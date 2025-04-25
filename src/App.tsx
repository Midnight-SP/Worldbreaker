import React, { useState, useEffect, useRef } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator';
import './styles/App.css';
import { calculateWorldStats } from './utils/mapGenerator/calculateWorldStats';

const App: React.FC = () => {
    const [map, setMap] = useState<Array<Array<{ altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; plate: number; features: string[]}>> | null>(null);
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
        const { map: newMap, riverPaths: newRiverPaths } = generateMap(width, height, plates, latitudeMode);
        setMap(newMap);
        setRiverPaths(newRiverPaths);
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

    const handleWidthChange = (newWidth: number) => {
        setWidth(newWidth);
        if (height > newWidth * 0.8) {
            setHeight(Math.floor(newWidth * 0.8)); // Adjust height to be at most 80% of the width
        }
    };
    
    const handleHeightChange = (newHeight: number) => {
        if (newHeight <= width * 0.8) {
            setHeight(newHeight); // Allow height changes only if within the 80% constraint
        }
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
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                            min="10"
                        />
                    </label>
                    <label>
                        Height:
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                            min="5"
                        />
                    </label>
                    <label>
                        Tectonic Plates:
                        <input
                            type="number"
                            value={plates}
                            onChange={(e) => setPlates(parseInt(e.target.value) || 1)}
                            min="1"
                        />
                    </label>
                    <button onClick={handleGenerateMap}>Generate Map</button>
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