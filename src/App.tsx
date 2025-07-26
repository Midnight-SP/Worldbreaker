import React, { useState, useEffect, useRef } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator';
import './styles/App.css';
import { calculateWorldStats } from './utils/mapGenerator/calculateWorldStats';
import { Map } from './utils/mapGenerator/types';

const App: React.FC = () => {
    const [map, setMap] = useState<Map | null>(null);
    const [width, setWidth] = useState<number>(100);
    const [height, setHeight] = useState<number>(80);
    const [plates, setPlates] = useState<number>(7);
    const [seed, setSeed] = useState<string>('');
    const [actualSeed, setActualSeed] = useState<string>('');
    const [visualizationType, setVisualizationType] = useState<string>('biomes');
    const [tooltip, setTooltip] = useState<string | null>(null);
    const [mapPosition, setMapPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    
    // Split show features into two separate toggles
    const [showNaturalFeatures, setShowNaturalFeatures] = useState<boolean>(true);
    const [showManmadeFeatures, setShowManmadeFeatures] = useState<boolean>(true);
    
    const [latitudeMode, setLatitudeMode] = useState<'full' | 'partial'>('full');
    const [copyNotification, setCopyNotification] = useState<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(true);
    const [showWorldInfo, setShowWorldInfo] = useState<boolean>(true);

    const mapWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Validation: Ensure width and height are valid
        if (!width || !height || width < 10 || height < 5) {
            console.warn('Invalid dimensions. Width must be at least 10 and height must be at least 5.');
            return; // Do not generate a new map
        }
    
        (async () => {
            const { map: newMap, seed: usedSeed } = await generateMap(width, height, plates, latitudeMode, seed);
            console.log('Generated map with seed:', usedSeed);
            setMap(newMap);
            setActualSeed(usedSeed); // Store the actual seed that was used
        })();
    }, [latitudeMode, width, height, plates, seed]);

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

    const handleGenerateRandomSeed = () => {
        // Generate a new random seed
        const newSeed = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setSeed(newSeed); // This will trigger the useEffect to generate a new map
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

    const handleCopySeed = async () => {
        try {
            await navigator.clipboard.writeText(actualSeed);
            setCopyNotification(true);
            setTimeout(() => setCopyNotification(false), 2000); // Hide after 2 seconds
        } catch (err) {
            console.error('Failed to copy seed:', err);
        }
    };

    // Toggle functions
    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const toggleWorldInfo = () => {
        setShowWorldInfo(!showWorldInfo);
    };

    return (
        <div className="App">
            <header className="header">
                <div className="header-top">
                    <h1>Worldbreaker: Procedurally Generated Hexagonal Map</h1>
                    <div className="header-buttons">
                        <button 
                            onClick={toggleControls}
                            className="toggle-button"
                            title={showControls ? "Hide Controls" : "Show Controls"}
                        >
                            {showControls ? "🔧 Hide Controls" : "🔧 Show Controls"}
                        </button>
                        <button 
                            onClick={toggleWorldInfo}
                            className="toggle-button"
                            title={showWorldInfo ? "Hide World Info" : "Show World Info"}
                        >
                            {showWorldInfo ? "📊 Hide Info" : "📊 Show Info"}
                        </button>
                    </div>
                </div>
                
                {/* Controls section - conditionally rendered */}
                {showControls && (
                    <div className="controls">
                        {/* Map Generation Group */}
                        <div className="control-group">
                            <h3>🌍 Map Generation</h3>
                            
                            <div className="control-item">
                                <div className="seed-controls">
                                    <div className="seed-input-wrapper">
                                        <label>Seed:</label>
                                        <input
                                            type="text"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value)}
                                            placeholder="Enter seed (optional)"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleGenerateRandomSeed} 
                                        disabled={width <= 0 || height <= 0}
                                        className="generate-button"
                                    >
                                        🎲 Random
                                    </button>
                                </div>
                                
                                {actualSeed && (
                                    <div className="seed-display">
                                        <label>Generated Seed:</label>
                                        <div className="seed-value-container">
                                            <span className="seed-value">{actualSeed}</span>
                                            <button 
                                                onClick={handleCopySeed}
                                                title="Copy seed to clipboard"
                                                className="copy-seed-button"
                                            >
                                                📋
                                            </button>
                                            {copyNotification && (
                                                <span className="copy-notification">Copied!</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map Properties Group */}
                        <div className="control-group">
                            <h3>📏 Map Properties</h3>
                            
                            <div className="control-item">
                                <label>Width:</label>
                                <input
                                    type="number"
                                    value={width || ''}
                                    onChange={(e) => handleWidthChange(e.target.value)}
                                    min="10"
                                    max="500"
                                />
                            </div>
                            
                            <div className="control-item">
                                <label>Height:</label>
                                <input
                                    type="number"
                                    value={height || ''}
                                    onChange={(e) => handleHeightChange(e.target.value)}
                                    min="5"
                                    max="500"
                                />
                            </div>
                            
                            <div className="control-item">
                                <label>Tectonic Plates:</label>
                                <input
                                    type="number"
                                    value={plates || ''}
                                    onChange={(e) => handlePlatesChange(e.target.value)}
                                    min="2"
                                    max="20"
                                />
                            </div>
                            
                            <div className="control-item">
                                <label>Latitude Mode:</label>
                                <select
                                    value={latitudeMode}
                                    onChange={(e) => setLatitudeMode(e.target.value === 'full' ? 'full' : 'partial')}
                                >
                                    <option value="full">Full (1 to -1)</option>
                                    <option value="partial">Partial (1 to 0)</option>
                                </select>
                            </div>
                        </div>

                        {/* Display Options Group - UPDATED */}
                        <div className="control-group">
                            <h3>🎨 Display Options</h3>
                            
                            <div className="control-item">
                                <label>Visualization:</label>
                                <select
                                    value={visualizationType}
                                    onChange={(e) => setVisualizationType(e.target.value)}
                                >
                                    <option value="biomes">Biomes</option>
                                    <option value="climate">Climate Zones</option>
                                    <option value="altitude">Altitude</option>
                                    <option value="temperature">Temperature</option>
                                    <option value="humidity">Humidity</option>
                                    <option value="vegetation">Vegetation</option>
                                    <option value="habitability">Habitability</option>
                                    <option value="plates">Tectonic Plates</option>
                                    <option value="geographic-regions">Geographic Regions</option>
                                </select>
                            </div>
                            
                            <div className="control-item">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        id="show-natural-features"
                                        checked={showNaturalFeatures}
                                        onChange={(e) => setShowNaturalFeatures(e.target.checked)}
                                    />
                                    <label htmlFor="show-natural-features">Show Natural Features</label>
                                </div>
                            </div>

                            <div className="control-item">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        id="show-manmade-features"
                                        checked={showManmadeFeatures}
                                        onChange={(e) => setShowManmadeFeatures(e.target.checked)}
                                    />
                                    <label htmlFor="show-manmade-features">Show Manmade Features</label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* World Info - conditionally rendered */}
                {showWorldInfo && (
                    <div className="world-info">
                        {map && (
                            <>
                                {/* Averages Section */}
                                <div className="info-category">
                                    <h4>📊 Averages</h4>
                                    <div className="info-category-content">
                                        <div className="info-item">
                                            <label>Altitude</label>
                                            <p>{calculateWorldStats(map).averageAltitude.toFixed(2)}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Temperature</label>
                                            <p>{calculateWorldStats(map).averageTemperature.toFixed(2)}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Humidity</label>
                                            <p>{calculateWorldStats(map).averageHumidity.toFixed(2)}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Vegetation</label>
                                            <p>{calculateWorldStats(map).averageVegetation.toFixed(2)}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Habitability</label>
                                            <p>{calculateWorldStats(map).averageHabitability.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Coverage Section */}
                                <div className="info-category">
                                    <h4>🌍 Coverage</h4>
                                    <div className="info-category-content">
                                        <div className="info-item">
                                            <label>Ocean Coverage</label>
                                            <p>{calculateWorldStats(map).oceanCoverage.toFixed(1)}%</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Land Coverage</label>
                                            <p>{(100 - calculateWorldStats(map).oceanCoverage).toFixed(1)}%</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Continents</label>
                                            <p>{calculateWorldStats(map).continentCount}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Major Oceans</label>
                                            <p>{calculateWorldStats(map).oceanCount}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Total Regions</label>
                                            <p>{calculateWorldStats(map).geographicRegionCount}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features Section */}
                                <div className="info-category">
                                    <h4>🏔️ Features</h4>
                                    <div className="info-category-content">
                                        <div className="info-item">
                                            <label>Water Sources</label>
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
                                    </div>
                                </div>

                                {/* Biomes Section - Updated to show separate land and ocean biomes */}
                                <div className="info-category biomes-category">
                                    <h4>🌿 Top Biomes</h4>
                                    <div className="biomes-container">
                                        {/* Land Biomes */}
                                        <div className="biome-section">
                                            <h5>🏔️ Land Biomes</h5>
                                            <div className="info-item biome-list">
                                                <ul>
                                                    {calculateWorldStats(map).topLandBiomes.map(({ biome, percentage }) => (
                                                        <li key={biome}>
                                                            <span className="biome-name">{biome.replace(/-/g, ' ')}</span>
                                                            <span className="biome-percentage">{percentage}%</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Ocean Biomes */}
                                        <div className="biome-section">
                                            <h5>🌊 Ocean Biomes</h5>
                                            <div className="info-item biome-list">
                                                <ul>
                                                    {calculateWorldStats(map).topOceanBiomes.map(({ biome, percentage }) => (
                                                        <li key={biome}>
                                                            <span className="biome-name">{biome.replace(/-/g, ' ')}</span>
                                                            <span className="biome-percentage">{percentage}%</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </header>
            
            <div
                className="map-wrapper"
                ref={mapWrapperRef}
                onMouseDown={handleMouseDown}
                style={{
                    transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    marginTop: showControls && showWorldInfo ? '180px' : 
                              showControls || showWorldInfo ? '120px' : '80px'
                }}
            >
                {map && (
                    <HexGrid
                        map={map}
                        visualizationType={visualizationType}
                        plates={plates}
                        setTooltip={setTooltip}
                        showNaturalFeatures={showNaturalFeatures}
                        showManmadeFeatures={showManmadeFeatures}
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