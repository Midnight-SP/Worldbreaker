import { getHexNeighbors } from "./hexNeighbors";

export function adjustVegetationBasedOnWater(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; vegetation: number; features: string[]; terrain: string }>>,
    height: number,
    width: number
): void {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            // Find the distance to the nearest water source
            const nearestWaterDistance = findNearestWaterDistance(map, row, col, height, width);

            // Adjust vegetation based on proximity to water
            if (nearestWaterDistance !== null) {
                // Reduce the base increase for vegetation near water
                const baseIncrease = Math.max(0, 0.2 - nearestWaterDistance * 0.03); // Lower base increase
                const randomFactor = Math.random() * 0.04 - 0.02; // Random variation in the range [-0.02, 0.02]
                const vegetationIncrease = Math.max(0, baseIncrease + randomFactor);
                tile.vegetation = Math.min(tile.vegetation + vegetationIncrease, 1); // Clamp to [0, 1]
            } else {
                // Increase the decrease for tiles far from water
                const randomFactor = Math.random() * 0.04 - 0.02; // Random variation in the range [-0.02, 0.02]
                const vegetationDecrease = 0.3 + randomFactor; // Higher decrease
                tile.vegetation = Math.max(tile.vegetation - vegetationDecrease, 0); // Clamp to [0, 1]
            }

            // Factor in altitude, temperature, and humidity for natural variation
            const altitudeFactor = Math.max(0, 1 - Math.abs(tile.altitude)) * 0.15; // Lower altitude impact
            const temperatureFactor = Math.max(0, 1 - Math.abs(tile.temperature - 0.5)) * 0.2; // Lower temperature impact
            const humidityFactor = tile.humidity * 0.4; // Lower humidity impact

            // Combine factors to adjust vegetation
            tile.vegetation = Math.min(
                tile.vegetation + altitudeFactor + temperatureFactor + humidityFactor,
                1
            );

            // Add a small random variation to ensure diversity
            tile.vegetation = Math.max(0, Math.min(tile.vegetation + (Math.random() * 0.03 - 0.015), 1));
        }
    }
}

export function findNearestWaterDistance(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; features: string[]; terrain: string }>>,
    row: number,
    col: number,
    height: number,
    width: number
): number | null {
    const visited = new Set<string>();
    const queue: Array<{ row: number; col: number; distance: number }> = [{ row, col, distance: 0 }];

    while (queue.length > 0) {
        const current = queue.shift(); // Get the next item from the queue
        if (!current) continue; // Skip if the queue is empty

        const { row: currentRow, col: currentCol, distance } = current; // Safely destructure
        const key = `${currentRow},${currentCol}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const tile = map[currentRow][currentCol];

        // Check if the current tile is a water source
        if (
            tile.features.includes('lake') ||
            tile.features.includes('river') ||
            tile.features.includes('source') ||
            isShoreline(map, currentRow, currentCol, height, width)
        ) {
            return distance; // Return the distance to the nearest water source
        }

        // Add neighbors to the queue
        const neighbors = getHexNeighbors(map, currentRow, currentCol, height, width);
        for (const neighbor of neighbors) {
            queue.push({ row: neighbor.row, col: neighbor.col, distance: distance + 1 });
        }
    }

    return null; // No water source found
}

function isShoreline(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; features: string[]; terrain: string }>>,
    row: number,
    col: number,
    height: number,
    width: number
): boolean {
    const neighbors = getHexNeighbors(map, row, col, height, width);

    const isLand = map[row][col].altitude >= 0;
    const isOcean = map[row][col].altitude < 0;

    return neighbors.some(neighbor => {
        const neighborTile = map[neighbor.row][neighbor.col];
        return (isLand && neighborTile.altitude < 0) || (isOcean && neighborTile.altitude >= 0);
    });
}