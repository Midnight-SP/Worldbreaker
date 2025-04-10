// Define biome parameters
const biomes = [
    { name: 'deep-ocean', altitude: -0.75, temperature: 0.5, humidity: 0.8 },
    { name: 'ocean', altitude: -0.25, temperature: 0.5, humidity: 0.8 },
    { name: 'desert', altitude: 0.2, temperature: 0.9, humidity: 0.2 },
    { name: 'plain', altitude: 0.3, temperature: 0.6, humidity: 0.5 },
    { name: 'rainforest', altitude: 0.4, temperature: 0.8, humidity: 0.9 },
    { name: 'savanna', altitude: 0.4, temperature: 0.8, humidity: 0.4 },
    { name: 'swamp', altitude: 0.4, temperature: 0.5, humidity: 0.9 },
    { name: 'forest', altitude: 0.6, temperature: 0.5, humidity: 0.6 },
    { name: 'taiga', altitude: 0.6, temperature: 0.2, humidity: 0.5 },
    { name: 'mountain', altitude: 0.8, temperature: 0.3, humidity: 0.4 },
    { name: 'tundra', altitude: 0.9, temperature: 0.1, humidity: 0.3 },
    { name: 'glacier', altitude: 1, temperature: 0, humidity: 0.2 },
    { name: 'volcano', altitude: 1, temperature: 0.9, humidity: 0.5 },
    { name: 'marsh', altitude: 0.2, temperature: 0.5, humidity: 0.9 },
    { name: 'wetland', altitude: 0.3, temperature: 0.6, humidity: 0.8 },
    { name: 'steppe', altitude: 0.4, temperature: 0.7, humidity: 0.4 },
    { name: 'jungle', altitude: 0.5, temperature: 0.9, humidity: 0.9 },
    { name: 'iceberg', altitude: -0.5, temperature: 0, humidity: 0.3 },
    { name: 'coral-reef', altitude: -0.2, temperature: 0.7, humidity: 0.9 },
    { name: 'redwood-forest', altitude: 0.6, temperature: 0.5, humidity: 0.7 },
];

// Define possible drift directions for hexagonal tiles
const driftDirections = [
    { dx: 1, dy: 0 }, // Right
    { dx: -1, dy: 0 }, // Left
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 }, // Down
    { dx: 1, dy: -1 }, // Up-right
    { dx: -1, dy: 1 }, // Down-left
];

// Generate the map
export function generateMap(width: number, height: number, continents: number): Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }>> {
    // Randomly choose continent centers
    const continentCenters = Array.from({ length: continents }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        drift: driftDirections[Math.floor(Math.random() * driftDirections.length)], // Assign random drift direction
    }));

    // Initialize the map with base tile data
    const map: Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }>> = Array.from({ length: height }, (_, rowIndex) =>
        Array(width).fill(null).map((_, colIndex) => {
            const tile = generateTile(rowIndex, colIndex, height);

            // Assign the tile to the closest continent
            const closestContinent = findClosestContinent(colIndex, rowIndex, continentCenters);
            return { ...tile, continent: closestContinent };
        })
    );

    // Apply continental drift to adjust altitudes
    applyContinentalDrift(map, continentCenters);

    // Smooth out altitude, temperature, and humidity
    smoothMap(map);

    // Determine biomes after smoothing
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.terrain = determineTerrain(tile.altitude, tile.temperature, tile.humidity);
        }
    }

    return map;
}

function smoothMap(map: Array<Array<{ altitude: number; temperature: number; humidity: number }>>): void {
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
        const neighborX = col + dx;
        const neighborY = row + dy;

        if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
            neighbors.push(map[neighborY][neighborX]);
        }
    }

    return neighbors;
}

// Apply continental drift effects
function applyContinentalDrift(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; terrain: string; latitude: number; continent: number }>>,
    continentCenters: Array<{ x: number; y: number; drift: { dx: number; dy: number } }>
): void {
    const height = map.length;
    const width = map[0].length;

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
            const neighborX = col + drift.dx;
            const neighborY = row + drift.dy;

            // Ensure the neighbor is within bounds
            if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
                const neighborTile = map[neighborY][neighborX];

                // Check for convergence, divergence, or transform
                if (neighborTile.continent !== continent) {
                    const neighborDrift = continentCenters[neighborTile.continent].drift;

                    // Scale altitude changes based on continent size
                    const continentScale = Math.log10(continentSizes[continent] + 1); // Logarithmic scaling
                    const neighborScale = Math.log10(continentSizes[neighborTile.continent] + 1);

                    if (neighborDrift.dx === -drift.dx && neighborDrift.dy === -drift.dy) {
                        // Convergence: Lower altitude (trench)
                        applyAltitudeEffect(map, row, col, -0.2 * continentScale, height, width);
                        applyAltitudeEffect(map, neighborY, neighborX, -0.2 * neighborScale, height, width);
                    } else if (neighborDrift.dx === drift.dx && neighborDrift.dy === drift.dy) {
                        // Divergence: Higher altitude (ridge)
                        applyAltitudeEffect(map, row, col, 0.2 * continentScale, height, width);
                        applyAltitudeEffect(map, neighborY, neighborX, 0.2 * neighborScale, height, width);
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

// Find the closest continent center to a tile
function findClosestContinent(x: number, y: number, centers: Array<{ x: number; y: number }>): number {
    let minDistance = Infinity;
    let closestContinents: number[] = [];

    centers.forEach((center, index) => {
        const distance = Math.sqrt(Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestContinents = [index];
        } else if (distance === minDistance) {
            closestContinents.push(index);
        }
    });

    // If multiple continents are equidistant, choose one randomly
    return closestContinents[Math.floor(Math.random() * closestContinents.length)];
}

// Generate a single tile
function generateTile(rowIndex: number, colIndex: number, totalRows: number): { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number } {
    const altitude = Math.random() * 1.6 - 0.75; // Base altitude between -0.2 and 0.2

    // Adjust latitude based on row and column
    const baseLatitude = 1 - (rowIndex / (totalRows - 0.5)) * 2; // Latitude from 1 (top) to -1 (bottom)
    const latitudeOffset = (colIndex % 2 === 1) ? (1 / totalRows) : 0; // Offset for even/odd columns
    let latitude = baseLatitude - latitudeOffset;

    // Adjust temperature based on latitude
    const absLatitude = Math.abs(latitude);
    const temperature = Math.min(Math.exp(-Math.pow(absLatitude - 0.25, 2) / 0.05) * Math.random() * 0.8 + (1 - absLatitude) * Math.random() * 0.5 + Math.random() * 0.05, 1); // Peak at 0.2 latitude

    // Adjust humidity based on latitude
    const humidity = Math.min((1 - absLatitude) * Math.random() * 0.9 + Math.random() * 0.3, 1);

    const terrain = determineTerrain(altitude, temperature, humidity);
    return { altitude, temperature, humidity, terrain, latitude };
}

// Determine the closest biome based on parameters
function determineTerrain(altitude: number, temperature: number, humidity: number): string {
    let closestBiome = biomes[0];
    let smallestDistance = calculateDistance(altitude, temperature, humidity, closestBiome);

    for (const biome of biomes) {
        const distance = calculateDistance(altitude, temperature, humidity, biome);
        if (distance < smallestDistance) {
            closestBiome = biome;
            smallestDistance = distance;
        }
    }

    return closestBiome.name;
}

// Calculate the distance between a tile's parameters and a biome's parameters
function calculateDistance(altitude: number, temperature: number, humidity: number, biome: { altitude: number; temperature: number; humidity: number }): number {
    return Math.sqrt(
        Math.pow(altitude - biome.altitude, 2) +
        Math.pow(temperature - biome.temperature, 2) +
        Math.pow(humidity - biome.humidity, 2)
    );
}