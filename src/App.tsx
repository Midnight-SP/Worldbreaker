import React, { useState, useEffect } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator';
import './styles/App.css';

const App: React.FC = () => {
    const [map, setMap] = useState<Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; plate: number }>> | null>(null);
    const [width, setWidth] = useState<number>(100); // Default width
    const [height, setHeight] = useState<number>(50); // Default height
    const [plates, setPlates] = useState<number>(5); // Default number of tectonic plates
    const [visualizationType, setVisualizationType] = useState<string>('biomes'); // Default visualization type
    const [tooltip, setTooltip] = useState<string | null>(null); // Tooltip state

    useEffect(() => {
        const newMap = generateMap(width, height, plates);
        setMap(newMap);
    }, [width, height, plates]);

    const handleGenerateMap = () => {
        const newMap = generateMap(width, height, plates);
        setMap(newMap);
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
                            onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                            min="10"
                        />
                    </label>
                    <label>
                        Height:
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
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
                            <option value="plates">Tectonic Plates</option>
                        </select>
                    </label>
                </div>
            </header>
            <div className="map-wrapper">
                {map && (
                    <HexGrid
                        map={map}
                        visualizationType={visualizationType}
                        plates={plates}
                        setTooltip={setTooltip} // Pass setTooltip to HexGrid
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