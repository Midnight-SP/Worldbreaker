import type { Map } from './types';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';
import { NameGenerator } from './nameGenerator';

export interface GeographicRegion {
    id: number;
    type: 'continent' | 'island' | 'archipelago' | 'ocean' | 'sea' | 'coastal-waters' | 'bay';
    name: string;
    tiles: Array<{ row: number; col: number }>;

    size: number;
    averageDepth?: number;
    averageElevation?: number;
    distanceFromEdge: number;
    isEnclosed?: boolean;
    parentLandRegionId?: number; // NEW: Track which land region this coastal water belongs to
}

export function identifyGeographicRegions(map: Map, seed: string): void {
    const height = map.length;
    const width = map[0].length;
    const visited = new Set<string>();
    let currentRegionId = 0;
    const regions: GeographicRegion[] = [];
    
    // Create name generator with the same seed (not seed + 'names')
    const nameGenerator = new NameGenerator(seed);

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

    // PRE-CALCULATE: Distance from land AND closest land region for all water tiles
    console.log('Pre-calculating distance from land and closest land region for all water tiles...');
    const landDistanceMap = new Map<string, number>();
    const closestLandRegionMap = new Map<string, number>(); // NEW: Track closest land region
    
    // Multi-source BFS from all land tiles at once
    const queue: Array<{ row: number; col: number; distance: number; landRegionId: number }> = [];
    const visitedBFS = new Set<string>();
    
    // Initialize queue with all land tiles (distance 0)
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            if (isLandTile(map[row][col])) {
                const key = `${row},${col}`;
                // We'll get the landRegionId after Step 1, so for now use a placeholder
                queue.push({ row, col, distance: 0, landRegionId: -1 });
                visitedBFS.add(key);
                landDistanceMap.set(key, 0);
            }
        }
    }
    
    // BFS to calculate distance from land for all tiles
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        
        const { row, col, distance, landRegionId } = current;
        
        const neighbors = getHexNeighbors(map, row, col, height, width);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visitedBFS.has(neighborKey)) {
                visitedBFS.add(neighborKey);
                const newDistance = distance + 1;
                landDistanceMap.set(neighborKey, newDistance);
                queue.push({ row: neighbor.row, col: neighbor.col, distance: newDistance, landRegionId });
            }
        }
    }
    
    console.log('Distance calculation complete.');

    // Fast lookup functions
    const getDistanceFromLand = (row: number, col: number): number => {
        return landDistanceMap.get(`${row},${col}`) || Infinity;
    };

    const getClosestLandRegion = (row: number, col: number): number | undefined => {
        return closestLandRegionMap.get(`${row},${col}`);
    };

    const floodFillAndClassify = (startRow: number, startCol: number, isLand: boolean, regionType?: GeographicRegion['type'], targetLandRegionId?: number, parentLandRegionName?: string): GeographicRegion | null => {
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

            // For coastal waters, check distance, depth, AND land region requirements
            if (regionType === 'coastal-waters') {
                const distanceFromLand = getDistanceFromLand(row, col);
                const tileAltitude = map[row][col].altitude;
                const closestLandRegion = getClosestLandRegion(row, col);
                
                // Coastal waters must be within 4 tiles of land AND between 0 and -0.4 altitude AND belong to the target land region
                if (distanceFromLand > 4 || 
                    tileAltitude < -0.4 || 
                    tileAltitude > 0 || 
                    closestLandRegion !== targetLandRegionId) {
                    continue;
                }
            }

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
                name = nameGenerator.getRegionName('continent');
            } else if (size > totalTiles * 0.02) {
                type = 'island';
                name = nameGenerator.getRegionName('island');
            } else {
                type = 'archipelago';
                name = nameGenerator.getRegionName('archipelago');
            }
        } else {
            // Use pre-defined type for coastal waters, otherwise classify normally
            if (regionType === 'coastal-waters') {
                type = 'coastal-waters';
                // Coastal waters are tied to their parent land region
                name = nameGenerator.getCoastalWatersName(parentLandRegionName || 'Unknown Land');
            } else {
                // Water classification for remaining water regions
                const avgDepth = totalDepth / size;
                const enclosed = isEnclosedByLand(tiles);
                
                if (enclosed && avgDepth < 0.4 && size < totalTiles * 0.03) {
                    type = 'bay';
                    name = nameGenerator.getRegionName('bay');
                } else if (enclosed && size < totalTiles * 0.15) {
                    type = 'sea';
                    name = nameGenerator.getRegionName('sea');
                } else if (size > totalTiles * 0.2) {
                    type = 'ocean';
                    name = nameGenerator.getRegionName('ocean');
                } else {
                    type = 'sea';
                    name = nameGenerator.getRegionName('sea');
                }
            }
        }

        // Set region type and name directly on all tiles
        for (const tile of tiles) {
            map[tile.row][tile.col].regionType = type;
            map[tile.row][tile.col].regionName = name;
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
            isEnclosed: !isLand ? isEnclosedByLand(tiles) : undefined,
            parentLandRegionId: regionType === 'coastal-waters' ? targetLandRegionId : undefined
        };
    };

    // STEP 1: Process land regions first
    console.log('Creating land regions...');
    const landRegions: GeographicRegion[] = [];
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const key = `${row},${col}`;
            if (!visited.has(key) && isLandTile(map[row][col])) {
                const region = floodFillAndClassify(row, col, true);
                if (region) {
                    regions.push(region);
                    landRegions.push(region);
                    currentRegionId++;
                }
            }
        }
    }

    // STEP 1.5: Now update the closest land region map using the actual region IDs
    console.log('Updating closest land region assignments...');
    const closestLandRegionQueue: Array<{ row: number; col: number; distance: number; landRegionId: number }> = [];
    const closestLandRegionVisited = new Set<string>();
    
    // Initialize with all land tiles and their actual region IDs
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            if (isLandTile(map[row][col]) && map[row][col].regionId !== undefined) {
                const key = `${row},${col}`;
                const landRegionId = map[row][col].regionId!;
                closestLandRegionQueue.push({ row, col, distance: 0, landRegionId });
                closestLandRegionVisited.add(key);
                closestLandRegionMap.set(key, landRegionId);
            }
        }
    }
    
    // BFS to assign closest land region to all water tiles
    while (closestLandRegionQueue.length > 0) {
        const current = closestLandRegionQueue.shift();
        if (!current) continue;
        
        const { row, col, distance, landRegionId } = current;
        
        const neighbors = getHexNeighbors(map, row, col, height, width);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!closestLandRegionVisited.has(neighborKey)) {
                closestLandRegionVisited.add(neighborKey);
                const newDistance = distance + 1;
                closestLandRegionMap.set(neighborKey, landRegionId);
                closestLandRegionQueue.push({ row: neighbor.row, col: neighbor.col, distance: newDistance, landRegionId });
            }
        }
    }

    // STEP 2: Create coastal waters for each land region separately
    console.log('Creating coastal water regions for each land region...');
    for (const landRegion of landRegions) {
        console.log(`Creating coastal waters for ${landRegion.name}...`);
        
        // Find all coastal water candidates for this specific land region
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const key = `${row},${col}`;
                const tile = map[row][col];
                
                if (!visited.has(key) && 
                    !isLandTile(tile) && 
                    getDistanceFromLand(row, col) <= 4 && 
                    tile.altitude >= -0.4 && 
                    tile.altitude <= 0 &&
                    getClosestLandRegion(row, col) === landRegion.id) {
                    
                    // Pass the parent land region name for coastal waters naming
                    const region = floodFillAndClassify(row, col, false, 'coastal-waters', landRegion.id, landRegion.name);
                    if (region) {
                        regions.push(region);
                        currentRegionId++;
                    }
                }
            }
        }
    }

    // STEP 3: Process remaining water regions (deeper waters)
    console.log('Creating deep water regions...');
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

    console.log(`Identified ${regions.length} geographic regions:`);
    regions.forEach(r => {
        const enclosedText = r.isEnclosed !== undefined ? (r.isEnclosed ? ' (enclosed)' : ' (open)') : '';
        const landRegionText = r.parentLandRegionId !== undefined ? ` (land region ${r.parentLandRegionId})` : '';
        console.log(`- ${r.name} (${r.type}): ${r.size} tiles (${((r.size / (width * height)) * 100).toFixed(1)}% of map)${enclosedText}${landRegionText}`);
    });
}

// Function to get region stats from tiles
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
        case 'coastal-waters':
            return `hsl(${(baseHue + 180) % 360}, 60%, 45%)`;
        default:
            return `hsl(${baseHue}, 60%, 50%)`;
    }
}