import { Map } from './types';
import { getHexNeighbors } from './hexNeighbors';

export function adjustVegetationBasedOnWater(map: Map, height: number, width: number, rng: () => number): void {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            const nearestWaterDistance = findNearestWaterDistance(map, row, col, height, width);

            if (nearestWaterDistance !== null) {
                const baseIncrease = Math.max(0, 0.2 - nearestWaterDistance * 0.03);
                const randomFactor = rng() * 0.04 - 0.02; // Use seeded RNG
                const vegetationIncrease = Math.max(0, baseIncrease + randomFactor);
                tile.vegetation = Math.min(tile.vegetation + vegetationIncrease, 1);
            } else {
                const randomFactor = rng() * 0.04 - 0.02; // Use seeded RNG
                const vegetationDecrease = 0.3 + randomFactor;
                tile.vegetation = Math.max(tile.vegetation - vegetationDecrease, 0);
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
            tile.vegetation = Math.max(0, Math.min(tile.vegetation + (rng() * 0.03 - 0.015), 1));
        }
    }
}

export function findNearestWaterDistance(
    map: Map,
    row: number,
    col: number,
    height: number,
    width: number
): number | null {
    const visited = new Set<string>();
    const queue: Array<{ row: number; col: number; distance: number }> = [{ row, col, distance: 0 }];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const { row: currentRow, col: currentCol, distance } = current;
        const key = `${currentRow},${currentCol}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const tile = map[currentRow][currentCol];
        if (tile.features.includes('lake') || tile.features.includes('river') || tile.features.includes('source') || isShoreline(map, currentRow, currentCol, height, width)) {
            return distance;
        }

        const neighbors = getHexNeighbors(map, currentRow, currentCol, height, width);
        for (const neighbor of neighbors) {
            queue.push({ row: neighbor.row, col: neighbor.col, distance: distance + 1 });
        }
    }

    return null; // No water source found
}

function isShoreline(
    map: Map,
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