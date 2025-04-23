import { getHexNeighbors } from "./hexNeighbors";

export function smoothMap(map: Array<Array<{
    altitude: number; 
    temperature: number; 
    humidity: number; 
    vegetation: number; 
    terrain: string; 
    latitude: number; 
    plate: number; 
    features: string[];
}>>): void {
    const height = map.length;
    const width = map[0].length;

    // Create a copy of the map to store smoothed values
    const smoothedMap = map.map(row => row.map(tile => ({ ...tile })));

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const neighborCoords = getHexNeighbors(map, row, col, height, width);
            const neighbors = neighborCoords.map(coord => map[coord.row][coord.col]);

            // Calculate the average values for altitude, temperature, and humidity
            const avgAltitude = neighbors.reduce((sum, tile) => sum + tile.altitude, map[row][col].altitude) / (neighbors.length + 1);
            const avgTemperature = neighbors.reduce((sum, tile) => sum + tile.temperature, map[row][col].temperature) / (neighbors.length + 1);
            const avgHumidity = neighbors.reduce((sum, tile) => sum + tile.humidity, map[row][col].humidity) / (neighbors.length + 1);

            // Add randomness to the smoothed values
            const randomFactor = 0.05; // Adjust this value to control the randomness
            const randomAltitude = avgAltitude + (Math.random() * 2 - 1) * randomFactor;
            const randomTemperature = avgTemperature + (Math.random() * 2 - 1) * randomFactor;
            const randomHumidity = avgHumidity + (Math.random() * 2 - 1) * randomFactor;

            // Update the smoothed map
            smoothedMap[row][col].altitude = Math.max(-1, Math.min(1, randomAltitude)); // Clamp to [-1, 1]
            smoothedMap[row][col].temperature = Math.max(0, Math.min(1, randomTemperature)); // Clamp to [0, 1]
            smoothedMap[row][col].humidity = Math.max(0, Math.min(1, randomHumidity)); // Clamp to [0, 1]
        }
    }

    // Copy smoothed values back to the original map
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            map[row][col].altitude = smoothedMap[row][col].altitude;
            map[row][col].temperature = smoothedMap[row][col].temperature;
            map[row][col].humidity = smoothedMap[row][col].humidity;
        }
    }
}

// Apply continental drift effects
export function applyContinentalDrift(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; plate: number; features: string[] }>>,
    plateCenters: Array<{ x: number; y: number; drift: { dx: number; dy: number } }>,
    width: number
): void {
    const height = map.length;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            const continent = tile.plate;
            const drift = plateCenters[continent].drift;

            const neighborX = (col + drift.dx + width) % width; // Wrap horizontally
            const neighborY = row + drift.dy;

            if (neighborY >= 0 && neighborY < height) {
                const neighborTile = map[neighborY][neighborX];

                // Check for plate convergence
                if (neighborTile.plate !== continent) {
                    const neighborDrift = plateCenters[neighborTile.plate].drift;

                    if (neighborDrift.dx === -drift.dx && neighborDrift.dy === -drift.dy) {
                        // Convergence: Generate a volcano with a 50% chance
                        if (Math.random() < 0.5) {
                            tile.features.push('volcano');
                            console.log(`Volcano generated at (${row}, ${col}) due to plate convergence.`);
                        }
                    }
                }
            }

            // Add a small random chance for volcano generation anywhere
            if (Math.random() < 0.005) { // 0.5% chance for random volcano
                tile.features.push('volcano');
                console.log(`Random volcano generated at (${row}, ${col}).`);
            }
        }
    }
}