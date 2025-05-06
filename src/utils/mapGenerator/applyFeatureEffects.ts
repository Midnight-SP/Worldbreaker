import { Map } from './types';
import { getHexNeighbors } from './hexNeighbors';

export function applyFeatureEffects(map: Map, height: number, width: number): void {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            // Apply effects based on features
            if (tile.features.includes('volcano')) {
                applyEffectToNeighbors(map, row, col, height, width, { temperature: 0.1 });
            }

            if (tile.features.includes('lake')) {
                applyEffectToNeighbors(map, row, col, height, width, { humidity: 0.15 });
            }

            if (tile.features.includes('river')) {
                applyEffectToNeighbors(map, row, col, height, width, { humidity: 0.05 });
            }

            if (tile.features.includes('source')) {
                tile.humidity = Math.min(tile.humidity + 0.1, 1);
            }
        }
    }
}

function applyEffectToNeighbors(
    map: Map,
    row: number,
    col: number,
    height: number,
    width: number,
    effects: { temperature?: number; humidity?: number }
): void {
    const neighbors = getHexNeighbors(map, row, col, height, width);

    for (const neighbor of neighbors) {
        const neighborTile = map[neighbor.row][neighbor.col];

        if (effects.temperature !== undefined) {
            neighborTile.temperature = Math.min(neighborTile.temperature + effects.temperature, 1);
        }

        if (effects.humidity !== undefined) {
            neighborTile.humidity = Math.min(neighborTile.humidity + effects.humidity, 1);
        }
    }
}