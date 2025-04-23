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
                // Use an exponential decay for vegetation falloff with added randomness
                const baseIncrease = Math.max(0, Math.exp(-nearestWaterDistance / 2)); // Decay factor of 2
                const randomFactor = Math.random() * 0.1 - 0.05; // Random variation in the range [-0.05, 0.05]
                const vegetationIncrease = Math.max(0, baseIncrease + randomFactor);
                tile.vegetation = Math.min(tile.vegetation + vegetationIncrease, 1); // Clamp to [0, 1]
            } else {
                // Decrease vegetation for tiles far from any water with added randomness
                const randomFactor = Math.random() * 0.1 - 0.05; // Random variation in the range [-0.05, 0.05]
                const vegetationDecrease = 0.2 + randomFactor;
                tile.vegetation = Math.max(tile.vegetation - vegetationDecrease, 0); // Clamp to [0, 1]
            }
        }
    }
}

function findNearestWaterDistance(
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