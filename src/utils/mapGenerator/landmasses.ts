import { Map } from './types';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';

export interface Landmass {
    id: number;
    tiles: Array<{ row: number; col: number }>;
    size: number;
}

export function identifyLandmasses(map: Map): Map & { landmassId?: number }[][] {
    const height = map.length;
    const width = map[0].length;
    const visited = new Set<string>();
    const landmassMap: (Map[0][0] & { landmassId?: number })[][] = map.map(row => 
        row.map(tile => ({ ...tile, landmassId: undefined }))
    );
    let currentLandmassId = 0;

    // Helper function to check if a tile is land
    const isLandTile = (tile: Map[0][0]): boolean => {
        return tile.altitude >= 0 && !oceanBiomes.some(ocean => ocean.name === tile.terrain);
    };

    // Flood fill algorithm to identify connected landmasses
    const floodFill = (startRow: number, startCol: number, landmassId: number): void => {
        const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const { row, col } = current;
            const key = `${row},${col}`;

            if (visited.has(key)) continue;
            if (row < 0 || row >= height || col < 0 || col >= width) continue;
            if (!isLandTile(map[row][col])) continue;

            visited.add(key);
            landmassMap[row][col].landmassId = landmassId;

            // Add neighbors to queue
            const neighbors = getHexNeighbors(map, row, col, height, width);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(neighborKey) && isLandTile(map[neighbor.row][neighbor.col])) {
                    queue.push({ row: neighbor.row, col: neighbor.col });
                }
            }
        }
    };

    // Find all landmasses
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const key = `${row},${col}`;
            if (!visited.has(key) && isLandTile(map[row][col])) {
                floodFill(row, col, currentLandmassId);
                currentLandmassId++;
            }
        }
    }

    console.log(`Identified ${currentLandmassId} landmasses`);
    return landmassMap;
}

export function getLandmassStats(map: (Map[0][0] & { landmassId?: number })[][]): Landmass[] {
    const landmasses: Record<number, Landmass> = {};
    
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
            const tile = map[row][col];
            if (tile.landmassId !== undefined) {
                if (!landmasses[tile.landmassId]) {
                    landmasses[tile.landmassId] = {
                        id: tile.landmassId,
                        tiles: [],
                        size: 0
                    };
                }
                landmasses[tile.landmassId].tiles.push({ row, col });
                landmasses[tile.landmassId].size++;
            }
        }
    }

    return Object.values(landmasses).sort((a, b) => b.size - a.size);
}