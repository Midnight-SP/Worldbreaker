import React, { useState, useEffect, useRef } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator';
import './styles/App.css';

const App: React.FC = () => {
    const [map, setMap] = useState<Array<Array<{ altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; plate: number; hasRiver: boolean }>> | null>(null);
    const [riverPaths, setRiverPaths] = useState<Array<{ start: [number, number]; end: [number, number]; width: number }>>([]);
    const [width, setWidth] = useState<number>(100);
    const [height, setHeight] = useState<number>(80);
    const [plates, setPlates] = useState<number>(7);
    const [visualizationType, setVisualizationType] = useState<string>('biomes');
    const [tooltip, setTooltip] = useState<string | null>(null);
    const [mapPosition, setMapPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [showRivers, setShowRivers] = useState<boolean>(true); // New state for toggling rivers

    const mapWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { map: newMap, riverPaths: newRiverPaths } = generateMap(width, height, plates);
        setMap(newMap);
        setRiverPaths(newRiverPaths);
    }, [width, height, plates]);

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
        const { map: newMap, riverPaths: newRiverPaths } = generateMap(width, height, plates);
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
                        Show Rivers:
                        <input
                            type="checkbox"
                            checked={showRivers}
                            onChange={(e) => setShowRivers(e.target.checked)}
                        />
                    </label>
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
                        riverPaths={showRivers ? riverPaths : []} // Conditionally pass river paths
                        visualizationType={visualizationType}
                        plates={plates}
                        setTooltip={setTooltip}
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