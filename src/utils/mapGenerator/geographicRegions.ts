import type { Map } from './types';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';

export interface GeographicRegion {
    id: number;
    type: 'continent' | 'island' | 'archipelago' | 'ocean' | 'sea' | 'strait' | 'bay';
    name: string;
    tiles: Array<{ row: number; col: number }>;

    size: number;
    averageDepth?: number;
    averageElevation?: number;
    distanceFromEdge: number;
    isEnclosed?: boolean;
}

export function identifyGeographicRegions(map: Map): void {
    const height = map.length;
    const width = map[0].length;
    const visited = new Set<string>();
    let currentRegionId = 0;
    const regions: GeographicRegion[] = [];

    // Helper function to check if a tile is land
    const isLandTile = (tile: Map[0][0]): boolean => {
        return tile.altitude >= 0 && !oceanBiomes.some(ocean => ocean.name === tile.terrain);
    };

    // Helper function to calculate distance from map edge
    const getDistanceFromEdge = (row: number, col: number): number => {
        return Math.min(row, col, height - row - 1, width - col - 1);
    };

    // Helper function to check if a water region is truly enclosed by land
    const isEnclosedByLand = (tiles: Array<{ row: number; col: number }>): boolean => {
        for (const tile of tiles) {
            const distanceFromEdge = getDistanceFromEdge(tile.row, tile.col);
            if (distanceFromEdge < 3) { 
                return false;
            }
        }
        return true;
    };

    // SIMPLIFIED: Check if a tile is part of a straight-line water passage
    const isSingleTileStrait = (row: number, col: number): boolean => {
        if (isLandTile(map[row][col])) return false;
        
        const neighbors = getHexNeighbors(map, row, col, height, width);
        const landNeighbors = neighbors.filter(n => isLandTile(map[n.row][n.col]));
        const waterNeighbors = neighbors.filter(n => !isLandTile(map[n.row][n.col]));
        
        // Must have at least 2 land neighbors to be narrow
        if (landNeighbors.length < 2) return false;
        // Must have exactly 2 water neighbors (for a straight line)
        if (waterNeighbors.length !== 2) return false;
        
        // The 2 water neighbors must be in opposite directions
        const water1 = waterNeighbors[0];
        const water2 = waterNeighbors[1];
        
        const dx1 = water1.col - col;
        const dy1 = water1.row - row;
        const dx2 = water2.col - col;
        const dy2 = water2.row - row;
        
        // Check if they are opposite directions
        if (!areOppositeDirections(dx1, dy1, dx2, dy2)) return false;
        
        // Both water neighbors must connect to larger water bodies
        return hasWaterBodyAccess(water1, row, col) && hasWaterBodyAccess(water2, row, col);
    };

    // Check if two directions are opposite (for hex grid)
    const areOppositeDirections = (dx1: number, dy1: number, dx2: number, dy2: number): boolean => {
        // For hex grid, exact opposites
        return (dx1 === -dx2 && dy1 === -dy2);
    };

    // Quick water body access check
    const hasWaterBodyAccess = (waterTile: { row: number; col: number }, avoidRow: number, avoidCol: number): boolean => {
        const queue = [waterTile];
        const visited = new Set<string>();
        const maxSearch = 5; // Reduced search area
        
        while (queue.length > 0 && visited.size < maxSearch) {
            const current = queue.shift()!;
            const key = `${current.row},${current.col}`;
            
            if (visited.has(key)) continue;
            if (current.row < 0 || current.row >= height || current.col < 0 || current.col >= width) continue;
            if (current.row === avoidRow && current.col === avoidCol) continue;
            if (isLandTile(map[current.row][current.col])) continue;
            
            visited.add(key);
            
            // If we found a small water area, consider it accessible
            if (visited.size >= 3) return true;
            
            const neighbors = getHexNeighbors(map, current.row, current.col, height, width);
            for (const neighbor of neighbors) {
                if (neighbor.row === avoidRow && neighbor.col === avoidCol) continue;
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(neighborKey) && !isLandTile(map[neighbor.row][neighbor.col])) {
                    queue.push(neighbor);
                }
            }
        }
        
        return visited.size >= 3;
    };

    // NEW: Check if a tile is part of a straight-line passage (water or land)
    const isPartOfStraightPassage = (row: number, col: number): { isStrait: boolean; direction?: { dx: number; dy: number } } => {
        // Check all possible straight-line directions from this tile
        const directions = [
            { dx: 1, dy: 0 },   // East
            { dx: -1, dy: 0 },  // West
            { dx: 0, dy: 1 },   // South
            { dx: 0, dy: -1 },  // North
            { dx: 1, dy: 1 },   // Southeast
            { dx: -1, dy: -1 }  // Northwest
        ];
        
        for (const direction of directions) {
            if (isValidStraitInDirection(row, col, direction)) {
                return { isStrait: true, direction };
            }
        }
        
        return { isStrait: false };
    };

    // NEW: Check if there's a valid strait in a specific direction
    const isValidStraitInDirection = (startRow: number, startCol: number, direction: { dx: number; dy: number }): boolean => {
        const sequence: Array<{ row: number; col: number; isLand: boolean }> = [];
        
        // Check sequence in both directions (up to 7 tiles total: L W W W W W L)
        for (let i = -3; i <= 3; i++) {
            const row = startRow + (i * direction.dy);
            const col = startCol + (i * direction.dx);
            
            if (row < 0 || row >= height || col < 0 || col >= width) continue;
            
            const isLand = isLandTile(map[row][col]);
            sequence.push({ row, col, isLand });
        }
        
        // Check if this sequence matches strait pattern: L W+ L
        return isValidStraitSequence(sequence);
    };

    // NEW: Check if a sequence of tiles forms a valid strait pattern
    const isValidStraitSequence = (sequence: Array<{ row: number; col: number; isLand: boolean }>): boolean => {
        if (sequence.length < 3) return false; // Need at least L W L
        
        // Find land-water-land patterns
        for (let i = 0; i < sequence.length - 2; i++) {
            // Look for pattern: Land, 1-5 Water tiles, Land
            if (sequence[i].isLand) {
                let waterCount = 0;
                let j = i + 1;
                
                // Count consecutive water tiles
                while (j < sequence.length && !sequence[j].isLand) {
                    waterCount++;
                    j++;
                }
                
                // Check if we have: Land + 1-5 Water + Land
                if (waterCount >= 1 && waterCount <= 5 && j < sequence.length && sequence[j].isLand) {
                    return true;
                }
            }
        }
        
        return false;
    };

    // SIMPLIFIED: Identify all strait tiles (both water and land that are part of straits)
    const identifyStraitTiles = (): Array<{ row: number; col: number }> => {
        const straitTiles: Array<{ row: number; col: number }> = [];
        const processedTiles = new Set<string>();
        
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const key = `${row},${col}`;
                if (processedTiles.has(key)) continue;
                
                const result = isPartOfStraightPassage(row, col);
                if (result.isStrait && result.direction) {
                    // Find the complete strait line in this direction
                    const straitLine = getCompleteStraitLine(row, col, result.direction);
                    
                    // Add all tiles in this strait line
                    for (const tile of straitLine) {
                        const tileKey = `${tile.row},${tile.col}`;
                        if (!processedTiles.has(tileKey)) {
                            // Only add water tiles to strait regions (land tiles stay as land regions)
                            if (!isLandTile(map[tile.row][tile.col])) {
                                straitTiles.push(tile);
                            }
                            processedTiles.add(tileKey);
                        }
                    }
                }
            }
        }
        
        return straitTiles;
    };

    // NEW: Get the complete strait line in a given direction
    const getCompleteStraitLine = (startRow: number, startCol: number, direction: { dx: number; dy: number }): Array<{ row: number; col: number }> => {
        const line: Array<{ row: number; col: number }> = [];
        
        // Extend in both directions to find the complete line
        const positions: Array<{ row: number; col: number }> = [];
        
        // Go backwards
        for (let i = -6; i < 0; i++) {
            const row = startRow + (i * direction.dy);
            const col = startCol + (i * direction.dx);
            if (row >= 0 && row < height && col >= 0 && col < width) {
                positions.push({ row, col });
            }
        }
        
        // Add current position
        positions.push({ row: startRow, col: startCol });
        
        // Go forwards
        for (let i = 1; i <= 6; i++) {
            const row = startRow + (i * direction.dy);
            const col = startCol + (i * direction.dx);
            if (row >= 0 && row < height && col >= 0 && col < width) {
                positions.push({ row, col });
            }
        }
        
        // Find the L W+ L pattern in this line
        const sequence = positions.map(pos => ({
            ...pos,
            isLand: isLandTile(map[pos.row][pos.col])
        }));
        
        // Extract the strait portion (including the land endpoints)
        for (let i = 0; i < sequence.length - 2; i++) {
            if (sequence[i].isLand) {
                let waterCount = 0;
                let j = i + 1;
                
                while (j < sequence.length && !sequence[j].isLand) {
                    waterCount++;
                    j++;
                }
                
                if (waterCount >= 1 && waterCount <= 5 && j < sequence.length && sequence[j].isLand) {
                    // Found L W+ L pattern, return the complete strait
                    for (let k = i; k <= j; k++) {
                        line.push({ row: sequence[k].row, col: sequence[k].col });
                    }
                    break;
                }
            }
        }
        
        return line;
    };

    // SIMPLIFIED: Group strait tiles into regions (they should already be linear)
    const expandStraitRegions = (straitTiles: Array<{ row: number; col: number }>): Array<Array<{ row: number; col: number }>> => {
        const regions: Array<Array<{ row: number; col: number }>> = [];
        const visitedStrait = new Set<string>();
        
        for (const tile of straitTiles) {
            const key = `${tile.row},${tile.col}`;
            if (visitedStrait.has(key)) continue;
            
            // Find connected strait tiles (should form a line)
            const region = findConnectedStraitTiles(tile, straitTiles, visitedStrait);
            
            if (region.length > 0 && region.length <= 5) { // 1-5 water tiles
                regions.push(region);
            }
        }
        
        return regions;
    };

    // NEW: Find all strait tiles connected to a starting tile
    const findConnectedStraitTiles = (
        startTile: { row: number; col: number }, 
        allStraitTiles: Array<{ row: number; col: number }>,
        visitedStrait: Set<string>
    ): Array<{ row: number; col: number }> => {
        const region: Array<{ row: number; col: number }> = [];
        const queue = [startTile];
        const straitSet = new Set(allStraitTiles.map(t => `${t.row},${t.col}`));
        
        while (queue.length > 0 && region.length < 5) {
            const current = queue.shift()!;
            const key = `${current.row},${current.col}`;
            
            if (visitedStrait.has(key)) continue;
            visitedStrait.add(key);
            region.push(current);
            
            // Find adjacent strait tiles in a straight line
            const neighbors = getHexNeighbors(map, current.row, current.col, height, width)
                .filter(n => straitSet.has(`${n.row},${n.col}`))
                .filter(n => !visitedStrait.has(`${n.row},${n.col}`));
            
            // Add neighbors (should maintain linearity)
            for (const neighbor of neighbors.slice(0, 2)) { // Max 2 neighbors for linearity
                queue.push(neighbor);
            }
        }
        
        return region;
    };

    const floodFillAndClassify = (startRow: number, startCol: number, isLand: boolean): GeographicRegion | null => {
        const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
        const tiles: Array<{ row: number; col: number }> = [];
        let totalElevation = 0;
        let totalDepth = 0;
        let totalDistanceFromEdge = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;

            const { row, col } = current;
            const key = `${row},${col}`;

            if (visited.has(key)) continue;
            if (row < 0 || row >= height || col < 0 || col >= width) continue;
            
            const tileIsLand = isLandTile(map[row][col]);
            if (tileIsLand !== isLand) continue;

            visited.add(key);
            tiles.push({ row, col });

            // Set region info directly on the tile
            map[row][col].regionId = currentRegionId;

            if (isLand) {
                totalElevation += Math.max(0, map[row][col].altitude);
            } else {
                totalDepth += Math.abs(Math.min(0, map[row][col].altitude));
            }
            totalDistanceFromEdge += getDistanceFromEdge(row, col);

            const neighbors = getHexNeighbors(map, row, col, height, width);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                const neighborIsLand = isLandTile(map[neighbor.row][neighbor.col]);
                if (!visited.has(neighborKey) && neighborIsLand === isLand) {
                    queue.push({ row: neighbor.row, col: neighbor.col });
                }
            }
        }

        if (tiles.length === 0) return null;

        const size = tiles.length;
        const totalTiles = width * height;
        const avgDistanceFromEdge = totalDistanceFromEdge / size;
        
        let type: GeographicRegion['type'];
        let name: string;

        if (isLand) {
            if (size > totalTiles * 0.15) {
                type = 'continent';
                name = `Continent ${Math.floor(currentRegionId / 2) + 1}`;
            } else if (size > totalTiles * 0.02) {
                type = 'island';
                name = `Island ${Math.floor(currentRegionId / 2) + 1}`;
            } else {
                type = 'archipelago';
                name = `Archipelago ${Math.floor(currentRegionId / 2) + 1}`;
            }
        } else {
            // Water classification
            const avgDepth = totalDepth / size;
            const enclosed = isEnclosedByLand(tiles);
            
            if (enclosed && avgDepth < 0.4 && size < totalTiles * 0.03) {
                type = 'bay';
                name = `Bay ${Math.floor(currentRegionId / 2) + 1}`;
            } else if (enclosed && size < totalTiles * 0.15) {
                type = 'sea';
                name = `Sea ${Math.floor(currentRegionId / 2) + 1}`;
            } else if (size > totalTiles * 0.2) {
                type = 'ocean';
                name = `Ocean ${Math.floor(currentRegionId / 2) + 1}`;
            } else {
                type = 'sea';
                name = `Sea ${Math.floor(currentRegionId / 2) + 1}`;
            }
        }

        // Set region type directly on all tiles
        for (const tile of tiles) {
            map[tile.row][tile.col].regionType = type;
        }

        return {
            id: currentRegionId,
            type,
            name,
            tiles,
            size,
            averageElevation: isLand ? totalElevation / size : undefined,
            averageDepth: !isLand ? totalDepth / size : undefined,
            distanceFromEdge: avgDistanceFromEdge,
            isEnclosed: !isLand ? isEnclosedByLand(tiles) : undefined
        };
    };

    // STEP 1: Identify strait tiles first (simple and fast)
    console.log('Identifying strait tiles...');
    const straitTiles = identifyStraitTiles();
    const straitRegions = expandStraitRegions(straitTiles);
    
    // Mark strait tiles and create strait regions
    straitRegions.forEach((straitRegion, index) => {
        const straitId = currentRegionId++;
        let totalDepth = 0;
        let totalDistance = 0;
        
        for (const tile of straitRegion) {
            visited.add(`${tile.row},${tile.col}`);
            map[tile.row][tile.col].regionId = straitId;
            map[tile.row][tile.col].regionType = 'strait';
            totalDepth += Math.abs(Math.min(0, map[tile.row][tile.col].altitude));
            totalDistance += getDistanceFromEdge(tile.row, tile.col);
        }
        
        regions.push({
            id: straitId,
            type: 'strait',
            name: `Strait ${index + 1}`,
            tiles: straitRegion,
            size: straitRegion.length,
            averageDepth: totalDepth / straitRegion.length,
            distanceFromEdge: totalDistance / straitRegion.length
        });
    });

    console.log(`Identified ${straitRegions.length} strait regions with ${straitTiles.length} total strait tiles`);

    // STEP 2: Process remaining water regions (excluding strait tiles)
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const key = `${row},${col}`;
            if (!visited.has(key) && !isLandTile(map[row][col])) {
                const region = floodFillAndClassify(row, col, false);
                if (region) {
                    regions.push(region);
                    currentRegionId++;
                }
            }
        }
    }

    // STEP 3: Process land regions
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const key = `${row},${col}`;
            if (!visited.has(key) && isLandTile(map[row][col])) {
                const region = floodFillAndClassify(row, col, true);
                if (region) {
                    regions.push(region);
                    currentRegionId++;
                }
            }
        }
    }

    console.log(`Identified ${regions.length} geographic regions:`);
    regions.forEach(r => {
        const enclosedText = r.isEnclosed !== undefined ? (r.isEnclosed ? ' (enclosed)' : ' (open)') : '';
        console.log(`- ${r.name} (${r.type}): ${r.size} tiles (${((r.size / (width * height)) * 100).toFixed(1)}% of map)${enclosedText}`);
    });
}

// Simple function to get region stats from tiles
export function getGeographicRegionStats(map: Map): GeographicRegion[] {
    const height = map.length;
    const width = map[0].length;
    
    const regionMap = new Map<number, {
        id: number;
        type: GeographicRegion['type'];
        tiles: Array<{ row: number; col: number }>;
        totalElevation: number;
        totalDepth: number;
        totalDistance: number;
        landTiles: number;
    }>();

    // Helper function to calculate distance from map edge
    const getDistanceFromEdge = (row: number, col: number): number => {
        return Math.min(row, col, height - row - 1, width - col - 1);
    };

    // Collect data from tiles
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            if (tile.regionId !== undefined && tile.regionType) {
                if (!regionMap.has(tile.regionId)) {
                    regionMap.set(tile.regionId, {
                        id: tile.regionId,
                        type: tile.regionType,
                        tiles: [],
                        totalElevation: 0,
                        totalDepth: 0,
                        totalDistance: 0,
                        landTiles: 0
                    });
                }
                
                const region = regionMap.get(tile.regionId)!;
                region.tiles.push({ row, col });
                
                if (tile.regionType === 'continent' || tile.regionType === 'island' || tile.regionType === 'archipelago') {
                    region.totalElevation += Math.max(0, tile.altitude);
                    region.landTiles++;
                } else {
                    region.totalDepth += Math.abs(Math.min(0, tile.altitude));
                }
                
                region.totalDistance += getDistanceFromEdge(row, col);
            }
        }
    }

    // Convert to GeographicRegion array with proper calculations
    return Array.from(regionMap.values()).map(r => ({
        id: r.id,
        type: r.type,
        name: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} ${r.id + 1}`,
        tiles: r.tiles,
        size: r.tiles.length,
        averageElevation: r.landTiles > 0 ? r.totalElevation / r.landTiles : undefined,
        averageDepth: r.tiles.length - r.landTiles > 0 ? r.totalDepth / (r.tiles.length - r.landTiles) : undefined,
        distanceFromEdge: r.totalDistance / r.tiles.length
    }));
}

export function getRegionColor(regionId: number, regionType: GeographicRegion['type']): string {
    const baseHue = (regionId * 137.5) % 360;
    
    switch (regionType) {
        case 'continent':
            return `hsl(${baseHue}, 70%, 60%)`;
        case 'island':
            return `hsl(${baseHue}, 60%, 55%)`;
        case 'archipelago':
            return `hsl(${baseHue}, 50%, 50%)`;
        case 'ocean':
            return `hsl(${(baseHue + 200) % 360}, 70%, 25%)`;
        case 'sea':
            return `hsl(${(baseHue + 200) % 360}, 60%, 35%)`;
        case 'bay':
            return `hsl(${(baseHue + 220) % 360}, 80%, 50%)`;
        case 'strait':
            return `hsl(${(baseHue + 180) % 360}, 100%, 70%)`;
        default:
            return `hsl(${baseHue}, 60%, 50%)`;
    }
}