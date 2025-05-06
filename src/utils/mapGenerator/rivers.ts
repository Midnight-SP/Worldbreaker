import { oceanBiomes } from './biomes';
import { getHexNeighbors } from './hexNeighbors';
import { Map } from './types';

export function generateRivers(
    map: Map,
    riverCount: number
): Array<{ start: [number, number]; end: [number, number]; width: number }> {
    const height = map.length;
    const width = map[0].length;
    const riverPaths: Array<{ start: [number, number]; end: [number, number]; width: number }> = [];

    let sourcesUsed = 0;

    for (let i = 0; i < riverCount; i++) {
        let row: number;
        let col: number;

        // Find the next unused source
        const sourceTiles = [];
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (map[r][c].features.includes('source') && !map[r][c].features.includes('river')) {
                    sourceTiles.push({ row: r, col: c });
                }
            }
        }

        if (sourceTiles.length > 0) {
            const randomSource = sourceTiles[Math.floor(Math.random() * sourceTiles.length)];
            row = randomSource.row;
            col = randomSource.col;
        } else {
            console.warn(`No valid sources found for river ${i + 1}.`);
            continue; // Skip to the next river if no sources are available
        }

        console.log(`Starting river ${i + 1} at (${row}, ${col})`);

        let previousTile = { row, col };
        let currentWidth = 1; // Initial river width

        // Skip the source tile itself and start from the lowest neighboring tile
        const neighbors = getHexNeighbors(map, row, col, height, width);
        const nextTile = neighbors.reduce((lowest, current) => {
            if (
                map[current.row][current.col].altitude < map[lowest.row][lowest.col].altitude
            ) {
                return current;
            }
            return lowest;
        }, { row, col });

        if (nextTile.row === row && nextTile.col === col) {
            console.log(`River ${i + 1} could not start due to no lower neighbor.`);
            continue; // Skip this river if no valid neighbor is found
        }

        // Move to the next tile to start the river
        row = nextTile.row;
        col = nextTile.col;

        while (map[row][col].altitude > 0) { // Stop if the river reaches altitude 0
            if (isWaterTile(map[row][col].terrain, map[row][col].features)) {
                console.log(`River ${i + 1} stopped at (${row}, ${col}) because it reached a water tile.`);
                break; // Stop if the tile is a water tile
            }

            map[row][col].features.push('river'); // Mark the tile as having a river

            // Find the lowest neighboring tile using hexagonal neighbors
            const neighbors = getHexNeighbors(map, row, col, height, width);

            // Find the lowest neighboring tile
            const nextTile = neighbors.reduce((lowest, current) => {
                if (
                    map[current.row][current.col].altitude < map[lowest.row][lowest.col].altitude
                ) {
                    return current;
                }
                return lowest;
            }, { row, col });

            if (nextTile.row === row && nextTile.col === col) {
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
            previousTile = { row, col };

            // Move to the next tile
            row = nextTile.row;
            col = nextTile.col;

            // Increase river width as it flows downhill
            currentWidth += 1;
        }

        sourcesUsed++;
    }

    return riverPaths;
}

// Helper function to check if a tile is a water tile (ocean or lake)
function isWaterTile(terrain: string, features: string[]): boolean {
    return features.includes('lake') || oceanBiomes.some(biome => biome.name === terrain);
}