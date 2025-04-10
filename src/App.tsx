import React, { useState, useEffect } from 'react';
import HexGrid from './components/HexGrid';
import { generateMap } from './utils/mapGenerator'; // This will resolve to index.ts
import './styles/App.css';

const App: React.FC = () => {
    const [map, setMap] = useState<Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }>> | null>(null);
    const [width, setWidth] = useState<number>(80); // Default width
    const [height, setHeight] = useState<number>(40); // Default height
    const [continents, setContinents] = useState<number>(5); // Default number of continents
    const [visualizationType, setVisualizationType] = useState<string>('biomes'); // Default visualization type

    useEffect(() => {
        const newMap = generateMap(width, height, continents);
        setMap(newMap);
    }, [width, height, continents]);

    const handleGenerateMap = () => {
        const newMap = generateMap(width, height, continents);
        setMap(newMap);
    };

    return (
        <div className="App">
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
                    Continents:
                    <input
                        type="number"
                        value={continents}
                        onChange={(e) => setContinents(parseInt(e.target.value) || 1)}
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
                        <option value="continents">Continents</option>
                    </select>
                </label>
            </div>
            {map && <HexGrid map={map} visualizationType={visualizationType} continents={continents} />}
        </div>
    );
};

export default App;