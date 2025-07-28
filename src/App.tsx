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
    const [showTradeRoutes, setShowTradeRoutes] = useState<boolean>(false);
    
    const [latitudeMode, setLatitudeMode] = useState<'full' | 'partial'>('full');
    const [copyNotification, setCopyNotification] = useState<boolean>(false);
    
    // NEW: Active tab state
    const [activeTab, setActiveTab] = useState<string | null>(null);

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
            setActualSeed(usedSeed);
        })();
    }, [latitudeMode, width, height, plates, seed]);

    useEffect(() => {
        const mapWrapper = mapWrapperRef.current;

        if (!mapWrapper) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            setZoom((prevZoom) => {
                const newZoom = prevZoom - e.deltaY * 0.001;
                return Math.min(Math.max(newZoom, 0.5), 3);
            });
        };

        mapWrapper.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            mapWrapper.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handleGenerateRandomSeed = () => {
        const newSeed = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setSeed(newSeed);
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
        setWidth(isNaN(parsedWidth) ? 0 : parsedWidth);
    };
    
    const handleHeightChange = (newHeight: number | string) => {
        const parsedHeight = parseInt(newHeight as string, 10);
        setHeight(isNaN(parsedHeight) ? 0 : parsedHeight);
    };

    const handlePlatesChange = (newPlates: number | string) => {
        const parsedPlates = parseInt(newPlates as string, 10);
        setPlates(isNaN(parsedPlates) ? 0 : parsedPlates);
    };

    const handleCopySeed = async () => {
        try {
            await navigator.clipboard.writeText(actualSeed);
            setCopyNotification(true);
            setTimeout(() => setCopyNotification(false), 2000);
        } catch (err) {
            console.error('Failed to copy seed:', err);
        }
    };

    // NEW: Tab toggle function
    const toggleTab = (tabName: string) => {
        setActiveTab(activeTab === tabName ? null : tabName);
    };

    // Visualization options
    const visualizationOptions = [
        { value: 'biomes', label: 'Biomes' },
        { value: 'altitude', label: 'Altitude' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'humidity', label: 'Humidity' },
        { value: 'vegetation', label: 'Vegetation' },
        { value: 'habitability', label: 'Habitability' },
        { value: 'plates', label: 'Tectonic Plates' },
        { value: 'geographic-regions', label: 'Geographic Regions' },
        { value: 'climate', label: 'Climate Zones' },
        { value: 'trade-routes', label: 'Trade Routes' },
    ];

    return (
        <div className="App">
            <header className="header">
                <div className="header-top">
                    <h1>Worldbreaker: Procedurally Generated Hexagonal Map</h1>
                </div>
                
                {/* NEW: Tab Navigation */}
                <div className="tab-navigation">
                    {/* Control Tabs */}
                    <div className="tab-group control-tabs">
                        <h3>🔧 Controls</h3>
                        <div className="tab-buttons">
                            <button 
                                onClick={() => toggleTab('generation')}
                                className={`tab-button ${activeTab === 'generation' ? 'active' : ''}`}
                            >
                                🌍 Generation
                            </button>
                            <button 
                                onClick={() => toggleTab('display')}
                                className={`tab-button ${activeTab === 'display' ? 'active' : ''}`}
                            >
                                🎨 Display
                            </button>
                            <button 
                                onClick={() => toggleTab('properties')}
                                className={`tab-button ${activeTab === 'properties' ? 'active' : ''}`}
                            >
                                📏 Properties
                            </button>
                        </div>
                    </div>

                    {/* Info Tabs */}
                    <div className="tab-group info-tabs">
                        <h3>📊 World Info</h3>
                        <div className="tab-buttons">
                            <button 
                                onClick={() => toggleTab('overview')}
                                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                            >
                                🌐 Overview
                            </button>
                            <button 
                                onClick={() => toggleTab('geography')}
                                className={`tab-button ${activeTab === 'geography' ? 'active' : ''}`}
                            >
                                🏔️ Geography
                            </button>
                            <button 
                                onClick={() => toggleTab('biomes')}
                                className={`tab-button ${activeTab === 'biomes' ? 'active' : ''}`}
                            >
                                🌿 Biomes
                            </button>
                            <button 
                                onClick={() => toggleTab('settlements')}
                                className={`tab-button ${activeTab === 'settlements' ? 'active' : ''}`}
                            >
                                🏘️ Settlements
                            </button>
                            <button 
                                onClick={() => toggleTab('trade')}
                                className={`tab-button ${activeTab === 'trade' ? 'active' : ''}`}
                            >
                                💰 Trade
                            </button>
                        </div>
                    </div>
                </div>

                {/* NEW: Tab Content Panels */}
                {activeTab && (
                    <div className="tab-content">
                        {/* Generation Tab */}
                        {activeTab === 'generation' && (
                            <div className="tab-panel generation-panel">
                                <div className="panel-content">
                                    <div className="control-section">
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

                                        <div className="control-item">
                                            <label>Latitude Mode:</label>
                                            <select
                                                value={latitudeMode}
                                                onChange={(e) => setLatitudeMode(e.target.value as 'full' | 'partial')}
                                            >
                                                <option value="full">Full Planet (Poles to Equator)</option>
                                                <option value="partial">Partial Region</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Display Tab */}
                        {activeTab === 'display' && (
                            <div className="tab-panel display-panel">
                                <div className="panel-content">
                                    <div className="control-section">
                                        <div className="control-item">
                                            <label>Visualization:</label>
                                            <select
                                                value={visualizationType}
                                                onChange={(e) => setVisualizationType(e.target.value)}
                                            >
                                                {visualizationOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="control-item toggle-item">
                                            <button
                                                onClick={() => setShowNaturalFeatures(!showNaturalFeatures)}
                                                className={`toggle-button ${showNaturalFeatures ? 'active' : ''}`}
                                            >
                                                <span className="toggle-icon">
                                                    {showNaturalFeatures ? '🌊' : '🚫'}
                                                </span>
                                                Natural Features
                                            </button>
                                        </div>

                                        <div className="control-item toggle-item">
                                            <button
                                                onClick={() => setShowManmadeFeatures(!showManmadeFeatures)}
                                                className={`toggle-button ${showManmadeFeatures ? 'active' : ''}`}
                                            >
                                                <span className="toggle-icon">
                                                    {showManmadeFeatures ? '🏘️' : '🚫'}
                                                </span>
                                                Manmade Features
                                            </button>
                                        </div>

                                        <div className="control-item toggle-item">
                                            <button
                                                onClick={() => setShowTradeRoutes(!showTradeRoutes)}
                                                className={`toggle-button ${showTradeRoutes ? 'active' : ''}`}
                                            >
                                                <span className="toggle-icon">
                                                    {showTradeRoutes ? '💰' : '🚫'}
                                                </span>
                                                Trade Routes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Properties Tab */}
                        {activeTab === 'properties' && (
                            <div className="tab-panel properties-panel">
                                <div className="panel-content">
                                    <div className="control-section">
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Overview Tab */}
                        {activeTab === 'overview' && map && (
                            <div className="tab-panel overview-panel">
                                <div className="panel-content">
                                    <div className="info-section">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Avg Altitude</label>
                                                <p>{calculateWorldStats(map).averageAltitude.toFixed(2)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Avg Temperature</label>
                                                <p>{calculateWorldStats(map).averageTemperature.toFixed(2)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Avg Humidity</label>
                                                <p>{calculateWorldStats(map).averageHumidity.toFixed(2)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Avg Vegetation</label>
                                                <p>{calculateWorldStats(map).averageVegetation.toFixed(2)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Avg Habitability</label>
                                                <p>{calculateWorldStats(map).averageHabitability.toFixed(2)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Ocean Coverage</label>
                                                <p>{calculateWorldStats(map).oceanCoverage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Geography Tab */}
                        {activeTab === 'geography' && map && (
                            <div className="tab-panel geography-panel">
                                <div className="panel-content">
                                    <div className="info-section">
                                        <div className="info-grid">
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
                                                <label>Continents</label>
                                                <p>{calculateWorldStats(map).continentCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Islands</label>
                                                <p>{calculateWorldStats(map).islandCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Archipelagos</label>
                                                <p>{calculateWorldStats(map).archipelagoCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Oceans</label>
                                                <p>{calculateWorldStats(map).oceanCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Seas</label>
                                                <p>{calculateWorldStats(map).seaCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Bays</label>
                                                <p>{calculateWorldStats(map).bayCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Biomes Tab */}
                        {activeTab === 'biomes' && map && (
                            <div className="tab-panel biomes-panel">
                                <div className="panel-content">
                                    <div className="biomes-container">
                                        <div className="biome-section">
                                            <h5>🌱 Top Land Biomes</h5>
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

                                        <div className="biome-section">
                                            <h5>🌊 Top Ocean Biomes</h5>
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
                            </div>
                        )}

                        {/* Settlements Tab */}
                        {activeTab === 'settlements' && map && (
                            <div className="tab-panel settlements-panel">
                                <div className="panel-content">
                                    <div className="info-section">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Villages</label>
                                                <p>{calculateWorldStats(map).villageCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Towns</label>
                                                <p>{calculateWorldStats(map).townCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Cities</label>
                                                <p>{calculateWorldStats(map).cityCount}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Total Settlements</label>
                                                <p>{calculateWorldStats(map).villageCount + calculateWorldStats(map).townCount + calculateWorldStats(map).cityCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trade Tab */}
                        {activeTab === 'trade' && map && (
                            <div className="tab-panel trade-panel">
                                <div className="panel-content">
                                    <div className="info-section">
                                        <div className="trade-overview">
                                            <div className="info-item">
                                                <label>Total Routes</label>
                                                <p>{calculateWorldStats(map).totalTradeRoutes}</p>
                                            </div>
                                        </div>
                                        
                                        {calculateWorldStats(map).topTradeRoutes.length > 0 ? (
                                            <div className="trade-routes-list">
                                                <h4>💰 Top Trade Routes</h4>
                                                {calculateWorldStats(map).topTradeRoutes.map((route, index) => (
                                                    <div key={index} className="trade-route-item">
                                                        <div className="route-header">
                                                            <span className="route-rank">#{index + 1}</span>
                                                            <span className="route-value">💰 {route.tradeValue}</span>
                                                        </div>
                                                        
                                                        <div className="route-details">
                                                            <div className="route-settlements">
                                                                <span className="settlement from">
                                                                    <span className={`settlement-icon ${route.from.type}`}>
                                                                        {route.from.type === 'city' ? '🏰' : 
                                                                         route.from.type === 'town' ? '🏘️' : '🏡'}
                                                                    </span>
                                                                    {route.from.name}
                                                                </span>
                                                                
                                                                <span className="route-arrow">
                                                                    {route.routeType === 'sea' ? '🚢' :
                                                                     route.routeType === 'river' ? '⛵' :
                                                                     route.routeType === 'mountain' ? '🏔️' : '🚛'}
                                                                    →
                                                                </span>
                                                                
                                                                <span className="settlement to">
                                                                    <span className={`settlement-icon ${route.to.type}`}>
                                                                        {route.to.type === 'city' ? '🏰' : 
                                                                         route.to.type === 'town' ? '🏘️' : '🏡'}
                                                                    </span>
                                                                    {route.to.name}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="route-stats">
                                                                <span className="route-distance">
                                                                    📏 {route.distance.toFixed(1)} tiles
                                                                </span>
                                                                <span className="route-type">
                                                                    🛤️ {route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-trade-routes">
                                                <p>No trade routes established</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                    marginTop: activeTab ? '60px' : '20px' // Adjust based on whether a tab is open
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
                        showTradeRoutes={showTradeRoutes}
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