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
                const shadowRow = row + windDirection.dy;
                const shadowCol = col + windDirection.dx; // No wrapping

                if (shadowRow >= 0 && shadowRow < height && shadowCol >= 0 && shadowCol < width) {
                    map[shadowRow][shadowCol].humidity *= 0.5; // Reduce humidity in the rain shadow
                }
            }
        }
    }
}

// Determine wind direction based on latitude
function getWindDirection(latitude: number): { dx: number; dy: number } {
    if (latitude > 0.3) {
        // Northern tropics: Winds blow southward
        return { dx: 0, dy: -1 };
    } else if (latitude > 0) {
        // Northern hemisphere: Winds blow northward
        return { dx: 0, dy: 1 };
    } else if (latitude > -0.3) {
        // Southern hemisphere: Winds blow southward
        return { dx: 0, dy: -1 };
    } else {
        // Southern tropics: Winds blow northward
        return { dx: 0, dy: 1 };
    }
}