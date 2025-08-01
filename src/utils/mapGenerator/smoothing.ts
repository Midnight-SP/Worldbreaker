import { getHexNeighbors, getNumericHexNeighbors } from "./hexNeighbors";
import { createNoise2D } from 'simplex-noise';
import { Map } from './types';

export function smoothMap(map: Map, rng: () => number): void {
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
            const randomAltitude = avgAltitude + (rng() * 2 - 1) * randomFactor;
            const randomTemperature = avgTemperature + (rng() * 2 - 1) * randomFactor;
            const randomHumidity = avgHumidity + (rng() * 2 - 1) * randomFactor;

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
export function applyPlateBoundaryEffects(
    map: Array<Array<{ altitude: number; features: string[]; plate: number }>>,
    boundaries: Array<{ row: number; col: number; type: 'convergent' | 'divergent' | 'transform' }>,
    plateSizes: Array<number>,
    rng: () => number
): void {
    const maxPlateSize = Math.max(...plateSizes); // Find the largest plate size for normalization

    for (const boundary of boundaries) {
        const tile = map[boundary.row][boundary.col];

        // Get the size of the plates involved in this boundary
        const plateSize = plateSizes[tile.plate];
        const sizeFactor = plateSize / maxPlateSize; // Normalize the size to [0, 1]

        if (boundary.type === 'convergent') {
            // Convergent boundaries create mountains or volcanoes
            tile.altitude += 0.3 * sizeFactor; // Scale altitude change by plate size
            if (rng() < 0.3 * sizeFactor) { // Scale volcano probability by plate size
                tile.features.push('volcano');
            }
        } else if (boundary.type === 'divergent') {
            // Divergent boundaries create rift valleys
            tile.altitude -= 0.2 * sizeFactor; // Scale altitude change by plate size
        } else if (boundary.type === 'transform') {
            // Transform boundaries create fault lines (no altitude change)
            if (rng() < 0.2 * sizeFactor) { // Scale fault line probability by plate size
                tile.features.push('fault-line');
            }
        }

        // Clamp altitude to valid range
        tile.altitude = Math.max(-1, Math.min(1, tile.altitude));
    }
}

export function distortPlateBoundaries(
    plateMap: Array<Array<number>>,
    width: number,
    height: number,
    rng: () => number // Add RNG parameter
): Array<Array<number>> {
    const noise = createNoise2D(rng); // Use seeded noise
    const noiseScale = 0.1;
    const distortionThreshold = 0.3;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const noiseValue = noise(row * noiseScale, col * noiseScale);

            if (Math.abs(noiseValue) > distortionThreshold) {
                const neighbors = getNumericHexNeighbors(plateMap, row, col, height, width);
                const neighborPlates = neighbors
                    .filter(
                        (neighbor) =>
                            neighbor.row >= 0 &&
                            neighbor.row < height &&
                            neighbor.col >= 0 &&
                            neighbor.col < width
                    )
                    .map((neighbor) => plateMap[neighbor.row][neighbor.col]);

                if (neighborPlates.length > 0) {
                    plateMap[row][col] = neighborPlates[Math.floor(rng() * neighborPlates.length)]; // Use seeded RNG
                }
            }
        }
    }

    return plateMap;
}