export function smoothMap(map: Array<Array<{ altitude: number; temperature: number; humidity: number }>>): void {
    const height = map.length;
    const width = map[0].length;

    // Create a copy of the map to store smoothed values
    const smoothedMap = map.map(row => row.map(tile => ({ ...tile })));

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const neighbors = getNeighbors(map, row, col, height, width);

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
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }>>,
    continentCenters: Array<{ x: number; y: number; drift: { dx: number; dy: number } }>,
    width: number
): void {
    const height = map.length;

    // Calculate the size of each continent
    const continentSizes = Array(continentCenters.length).fill(0);
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            continentSizes[tile.continent]++;
        }
    }

    // Iterate through each tile and adjust altitude based on drift interactions
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            const continent = tile.continent;
            const drift = continentCenters[continent].drift;

            // Calculate the neighboring tile in the drift direction
            const neighborX = (col + drift.dx + width) % width; // Wrap horizontally
            const neighborY = row + drift.dy;

            // Ensure the neighbor is within bounds
            if (neighborY >= 0 && neighborY < height) {
                const neighborTile = map[neighborY][neighborX];

                // Check for convergence, divergence, or transform
                if (neighborTile.continent !== continent) {
                    const neighborDrift = continentCenters[neighborTile.continent].drift;

                    // Scale altitude changes based on continent size
                    const continentScale = Math.log10(continentSizes[continent] + 1); // Logarithmic scaling
                    const neighborScale = Math.log10(continentSizes[neighborTile.continent] + 1);

                    if (neighborDrift.dx === -drift.dx && neighborDrift.dy === -drift.dy) {
                        // Convergence: Lower altitude (trench)
                        applyAltitudeEffect(map, row, col, -0.2, height, width);
                        applyAltitudeEffect(map, neighborY, neighborX, -0.2, height, width);
                    } else if (neighborDrift.dx === drift.dx && neighborDrift.dy === drift.dy) {
                        // Divergence: Higher altitude (ridge)
                        applyAltitudeEffect(map, row, col, 0.2, height, width);
                        applyAltitudeEffect(map, neighborY, neighborX, 0.2, height, width);
                    }
                    // Transform: No altitude changes
                }
            }
        }
    }
}

// Apply altitude effect to a tile and its neighbors
function applyAltitudeEffect(
    map: Array<Array<{ altitude: number }>>,
    row: number,
    col: number,
    altitudeChange: number,
    height: number,
    width: number
): void {
    const effectRadius = 2; // Radius of the effect (wider for larger continents)
    for (let dy = -effectRadius; dy <= effectRadius; dy++) {
        for (let dx = -effectRadius; dx <= effectRadius; dx++) {
            const neighborX = col + dx;
            const neighborY = row + dy;

            // Ensure the neighbor is within bounds and within the effect radius
            if (
                neighborX >= 0 &&
                neighborX < width &&
                neighborY >= 0 &&
                neighborY < height &&
                Math.abs(dx) + Math.abs(dy) <= effectRadius // Hexagonal distance
            ) {
                const neighborTile = map[neighborY][neighborX];
                neighborTile.altitude = Math.max(
                    Math.min(neighborTile.altitude + altitudeChange * (1 - (Math.abs(dx) + Math.abs(dy)) / effectRadius), 1),
                    -1
                );
            }
        }
    }
}

function getNeighbors(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number }>>,
    row: number,
    col: number,
    height: number,
    width: number
): Array<{ altitude: number; temperature: number; humidity: number }> {
    const neighbors = [];
    const directions = [
        { dx: 1, dy: 0 }, // Right
        { dx: -1, dy: 0 }, // Left
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 }, // Down
        { dx: 1, dy: -1 }, // Up-right
        { dx: -1, dy: 1 }, // Down-left
    ];

    for (const { dx, dy } of directions) {
        const neighborX = (col + dx + width) % width; // Wrap horizontally
        const neighborY = row + dy;

        if (neighborY >= 0 && neighborY < height) {
            neighbors.push(map[neighborY][neighborX]);
        }
    }

    return neighbors;
}