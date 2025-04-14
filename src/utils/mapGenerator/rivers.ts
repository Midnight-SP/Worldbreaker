import { oceanBiomes } from './biomes';
import { getHexNeighbors } from './hexNeighbors';

export function generateRivers(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; hasRiver: boolean; riverWidth?: number; terrain: string }>>,
    riverCount: number
): Array<{ start: [number, number]; end: [number, number]; width: number }> {
    const height = map.length;
    const width = map[0].length;
    const riverPaths: Array<{ start: [number, number]; end: [number, number]; width: number }> = [];

    for (let i = 0; i < riverCount; i++) {
        let row: number;
        let col: number;
        let retries = 0; // Retry counter

        // Find a valid starting point
        do {
            row = Math.floor(Math.random() * height);
            col = Math.floor(Math.random() * width);
            retries++;

            if (retries > 1000) {
                console.warn(`Failed to find a valid starting point for river ${i + 1} after 1000 retries.`);
                break; // Skip this river if no valid starting point is found
            }
        } while (
            !isValidStartingPoint(map, row, col, height, width) || // Ensure the starting point is valid
            map[row][col].altitude <= 0.4 || // Altitude must be above 0.4
            map[row][col].temperature >= 0.8 // Temperature must be below 0.8
        );

        if (retries > 1000) continue; // Skip to the next river if retries exceeded

        console.log(`Starting river ${i + 1} at (${row}, ${col})`);

        let previousTile = { row, col };
        let currentWidth = 1; // Initial river width

        while (map[row][col].altitude > 0) { // Stop if the river reaches altitude 0
            map[row][col].hasRiver = true; // Mark the tile as having a river
            map[row][col].riverWidth = (map[row][col].riverWidth || 0) + currentWidth; // Add to river width
            map[row][col].humidity += Math.random() * 0.3; // Increase humidity in the river tile

            // Find the lowest neighboring tile using hexagonal neighbors
            const neighbors = getHexNeighbors(map, row, col, height, width);

            // Check if there are any ocean tiles among the neighbors
            const oceanNeighbors = neighbors.filter(({ row: r, col: c }) =>
                oceanBiomes.some(biome => biome.name === map[r][c].terrain)
            );

            if (oceanNeighbors.length > 0) {
                // Randomly select one of the ocean tiles
                const nextTile = oceanNeighbors[Math.floor(Math.random() * oceanNeighbors.length)];

                riverPaths.push({
                    start: [previousTile.row, previousTile.col],
                    end: [nextTile.row, nextTile.col],
                    width: currentWidth,
                });

                map[nextTile.row][nextTile.col].hasRiver = true; // Mark the ocean tile as having a river
                console.log(`River ${i + 1} reached the ocean at (${nextTile.row}, ${nextTile.col}).`);
                break; // Stop the river as it reaches the ocean
            }

            // Find the lowest neighboring tile
            const nextTile = neighbors.reduce((lowest, current) => {
                if (
                    map[current.row][current.col].altitude <
                    map[lowest.row][lowest.col].altitude
                ) {
                    return current;
                }
                return lowest;
            }, { row, col });

            if (
                nextTile.row === row &&
                nextTile.col === col
            ) {
                console.log(`River ${i + 1} stopped at (${row}, ${col}) due to no lower neighbor.`);
                break; // Stop if no lower neighbor
            }

            // Add the river segment to the path
            riverPaths.push({
                start: [previousTile.row, previousTile.col],
                end: [nextTile.row, nextTile.col],
                width: currentWidth,
            });

            // Update previousTile to the current tile
            previousTile = { row: nextTile.row, col: nextTile.col };

            // Move to the next tile
            row = nextTile.row;
            col = nextTile.col;

            // Increase river width as it flows downhill
            currentWidth += 1;
        }

        // If the river ends without reaching an ocean, create a lake
        if (!oceanBiomes.some(biome => biome.name === map[row][col].terrain)) {
            map[row][col].terrain = 'lake'; // Mark the tile as a lake
            map[row][col].humidity = 1; // Maximize humidity for the lake
            map[row][col].hasRiver = true; // Mark the lake tile as having a river
            console.log(`River ${i + 1} ended in a lake at (${row}, ${col}).`);
        }
    }

    return riverPaths;
}

function isValidStartingPoint(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; hasRiver: boolean }>>,
    row: number,
    col: number,
    height: number,
    width: number
): boolean {
    if (map[row][col].hasRiver) return false; // Current tile already has a river

    // Check neighboring tiles
    const neighbors = getHexNeighbors(map, row, col, height, width);

    for (const { row: r, col: c } of neighbors) {
        if (map[r][c].hasRiver) {
            return false; // Neighboring tile already has a river
        }
    }

    return true; // Valid starting point
}