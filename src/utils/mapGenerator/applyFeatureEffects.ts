import { getHexNeighbors } from "./hexNeighbors";

export function applyFeatureEffects(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; features: string[] }>>,
    height: number,
    width: number
): void {
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            // Apply effects based on features
            if (tile.features.includes('volcano')) {
                // Volcanoes increase temperature in the surrounding area
                applyEffectToNeighbors(map, row, col, height, width, {
                    temperature: 0.2, // Increase temperature
                });
            }

            if (tile.features.includes('lake')) {
                // Lakes increase humidity in the surrounding area
                applyEffectToNeighbors(map, row, col, height, width, {
                    humidity: 0.3, // Increase humidity
                });
            }

            if (tile.features.includes('river')) {
                // Rivers slightly increase humidity in the surrounding area
                applyEffectToNeighbors(map, row, col, height, width, {
                    humidity: 0.1, // Slight increase in humidity
                });
            }

            if (tile.features.includes('source')) {
                // Sources slightly increase humidity locally
                tile.humidity = Math.min(tile.humidity + 0.2, 1); // Clamp to [0, 1]
            }
        }
    }
}

function applyEffectToNeighbors(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; features: string[] }>>,
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
            neighborTile.temperature = Math.min(neighborTile.temperature + effects.temperature, 1); // Clamp to [0, 1]
        }

        if (effects.humidity !== undefined) {
            neighborTile.humidity = Math.min(neighborTile.humidity + effects.humidity, 1); // Clamp to [0, 1]
        }
    }
}