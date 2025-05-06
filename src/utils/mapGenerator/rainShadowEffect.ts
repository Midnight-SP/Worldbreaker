export function applyRainShadowEffect(
    map: Array<Array<{ altitude: number; humidity: number; latitude: number }>>
): void {
    const height = map.length;
    const width = map[0].length;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            // Determine wind direction based on latitude
            const windDirection = getWindDirection(tile.latitude);

            if (tile.altitude > 0.6) { // High altitude (mountains)
                let shadowRow = row;
                let shadowCol = col;

                // Extend the rain shadow effect for multiple tiles downwind
                for (let distance = 1; distance <= 5; distance++) { // Extend up to 5 tiles
                    shadowRow += windDirection.dy;
                    shadowCol += windDirection.dx;

                    // Ensure the shadow tile is within bounds
                    if (shadowRow < 0 || shadowRow >= height || shadowCol < 0 || shadowCol >= width) {
                        break;
                    }

                    const shadowTile = map[shadowRow][shadowCol];

                    // Reduce humidity based on distance and mountain altitude
                    const distanceFactor = 1 - distance * 0.2; // Humidity reduction decreases with distance
                    const altitudeFactor = Math.min(1, tile.altitude); // Higher mountains have a stronger effect
                    shadowTile.humidity *= Math.max(0, 1 - 0.5 * altitudeFactor * distanceFactor);
                }
            }
        }
    }
}

// Determine wind direction based on latitude and global wind patterns
function getWindDirection(latitude: number): { dx: number; dy: number } {
    if (latitude > 0.6) {
        // Polar easterlies: Winds blow southwest in the northern hemisphere
        return { dx: -1, dy: 1 };
    } else if (latitude > 0.3) {
        // Westerlies: Winds blow northeast in the northern hemisphere
        return { dx: 1, dy: -1 };
    } else if (latitude > 0) {
        // Trade winds: Winds blow southwest in the northern tropics
        return { dx: -1, dy: 1 };
    } else if (latitude > -0.3) {
        // Trade winds: Winds blow northwest in the southern tropics
        return { dx: 1, dy: -1 };
    } else if (latitude > -0.6) {
        // Westerlies: Winds blow southeast in the southern hemisphere
        return { dx: -1, dy: 1 };
    } else {
        // Polar easterlies: Winds blow northwest in the southern hemisphere
        return { dx: 1, dy: -1 };
    }
}