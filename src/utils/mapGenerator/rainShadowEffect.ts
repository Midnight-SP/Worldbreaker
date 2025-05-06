import { Map } from './types';

export function applyRainShadowEffect(map: Map): void {
    const height = map.length;
    const width = map[0].length;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            if (tile.altitude <= 0.6) continue; // Skip low-altitude tiles

            const windDirection = getWindDirection(tile.latitude);
            let shadowRow = row;
            let shadowCol = col;

            for (let distance = 1; distance <= 5; distance++) { // Limit shadow distance
                shadowRow += windDirection.dy;
                shadowCol += windDirection.dx;

                if (shadowRow < 0 || shadowRow >= height || shadowCol < 0 || shadowCol >= width) {
                    break;
                }

                const shadowTile = map[shadowRow][shadowCol];
                const distanceFactor = 1 - distance * 0.2;
                const altitudeFactor = Math.min(1, tile.altitude);
                shadowTile.humidity *= Math.max(0, 1 - 0.5 * altitudeFactor * distanceFactor);
            }
        }
    }
}

function getWindDirection(latitude: number): { dx: number; dy: number } {
    if (latitude > 0.6) return { dx: -1, dy: 1 };
    if (latitude > 0.3) return { dx: 1, dy: -1 };
    if (latitude > 0) return { dx: -1, dy: 1 };
    if (latitude > -0.3) return { dx: 1, dy: -1 };
    if (latitude > -0.6) return { dx: -1, dy: 1 };
    return { dx: 1, dy: -1 };
}