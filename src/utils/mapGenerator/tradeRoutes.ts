import type { Tile, TravelBonuses, TradeRoute } from './types';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';

// UPDATED: Comprehensive terrain travel costs for all biomes (higher = slower/more expensive)
const TERRAIN_COSTS: Record<string, number> = {
    // Ocean biomes - Generally fast for sea travel
    'abyss': 0.4,                    // Very deep, but smooth sailing
    'deep-ocean': 0.5,               // Fast sea travel
    'deep-cold-ocean': 0.6,          // Slightly slower due to conditions
    'deep-warm-ocean': 0.5,          // Good for sea travel
    'ocean': 0.6,                    // Standard ocean travel
    'cold-ocean': 0.7,               // Harsher conditions
    'warm-ocean': 0.5,               // Favorable conditions
    'coral-reef': 1.2,               // Dangerous for large vessels
    'iceberg': 2.0,                  // Very dangerous for navigation

    // Hot and dry biomes - Difficult land travel
    'desert': 2.5,                   // Very difficult, hot and waterless
    'lush-desert': 2.2,              // Slightly better with some vegetation
    'arid-desert': 2.8,              // Extremely harsh
    'dunes': 3.0,                    // Shifting sands are very difficult
    'mesa': 2.0,                     // Rocky but manageable
    'badlands': 2.3,                 // Rough terrain

    // Grasslands and plains - Easy land travel
    'plain': 1.0,                    // Base cost - ideal for travel
    'grassland': 1.1,                // Very good for travel
    'savanna': 1.4,                  // Open but can be dry
    'steppe': 1.3,                   // Good for travel
    'prairie': 1.2,                  // Excellent for travel

    // Wet and tropical biomes - Difficult due to vegetation and moisture
    'rainforest': 3.5,               // Dense vegetation, very difficult
    'jungle': 3.2,                   // Dense and humid
    'mangrove': 2.8,                 // Swampy and complex
    'swamp': 3.0,                    // Waterlogged and treacherous
    'wetland': 2.4,                  // Moist but manageable
    'marsh': 2.6,                    // Soggy ground
    'bog': 2.8,                      // Very soggy and unstable

    // Forests - Moderate to difficult depending on density
    'forest': 1.8,                   // Moderate difficulty
    'redwood-forest': 2.2,           // Dense old growth
    'savanna-forest': 1.6,           // More open forest
    'temperate-forest': 1.7,         // Manageable forest
    'boreal-forest': 2.0,            // Northern forest, some obstacles
    'deciduous-forest': 1.6,         // Seasonal forest, generally open

    // Cold biomes - Difficult due to weather and terrain
    'taiga': 2.4,                    // Cold forest, challenging
    'tundra': 2.8,                   // Frozen ground, very cold
    'glacier': 4.0,                  // Extremely dangerous and slow
    'permafrost': 3.5,               // Frozen ground year-round

    // Mountainous biomes - Very difficult due to elevation and terrain
    'mountain': 3.2,                 // High elevation, rocky
    'alpine': 3.8,                   // Very high elevation, extreme conditions
    'rocky-mountain': 3.4,           // Rocky and steep
};

// Calculate travel bonuses for a settlement based on surrounding terrain
export function calculateTravelBonuses(map: Tile[][], row: number, col: number): TravelBonuses {
    const height = map.length;
    const width = map[0].length;
    const tile = map[row][col];
    
    // Get all neighbors within 2 tiles (extended influence range)
    const neighbors = getExtendedNeighbors(map, row, col, 2, height, width);
    
    let landTiles = 0;
    let waterTiles = 0;
    let riverTiles = 0;
    let mountainTiles = 0;
    
    for (const neighbor of neighbors) {
        const neighborTile = map[neighbor.row][neighbor.col];
        
        // Count different terrain types
        if (neighborTile.altitude <= 0 || oceanBiomes.some(biome => biome.name === neighborTile.terrain)) {
            waterTiles++;
        } else {
            landTiles++;
        }
        
        // Count water features for river travel
        if (neighborTile.features.includes('river') || 
            neighborTile.features.includes('lake') || 
            neighborTile.features.includes('source')) {
            riverTiles++;
        }
        
        // Count high altitude tiles for mountain travel
        if (neighborTile.altitude > 0.5) {
            mountainTiles++;
        }
    }
    
    // Base bonuses from settlement habitability
    const habitabilityBonus = tile.habitability * 0.5;
    
    // Calculate base bonuses (higher = better travel options)
    const baseLandTravel = habitabilityBonus + (landTiles * 0.12);
    const baseSeaTravel = habitabilityBonus + (waterTiles * 0.15);
    const baseRiverTravel = habitabilityBonus + (riverTiles * 0.2);
    const baseMountainTravel = habitabilityBonus + (mountainTiles * 0.1);
    
    let settlementMultiplier = 1.0;
    
    if (tile.features.includes('city')) {
        settlementMultiplier = 1.5;
    } else if (tile.features.includes('town')) {
        settlementMultiplier = 1.25;
    }
    
    return {
        landTravel: Math.min(baseLandTravel * settlementMultiplier, 2.0), // Cap bonuses at 2.0
        seaTravel: Math.min(baseSeaTravel * settlementMultiplier, 2.0),
        riverTravel: Math.min(baseRiverTravel * settlementMultiplier, 2.0),
        mountainTravel: Math.min(baseMountainTravel * settlementMultiplier, 2.0),
    };
}

// Get neighbors within a certain radius
function getExtendedNeighbors(
    map: Tile[][], 
    centerRow: number, 
    centerCol: number, 
    radius: number,
    height: number, 
    width: number
): Array<{ row: number; col: number; distance: number }> {
    const neighbors: Array<{ row: number; col: number; distance: number }> = [];
    const visited = new Set<string>();
    const queue = [{ row: centerRow, col: centerCol, distance: 0 }];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        const key = `${current.row},${current.col}`;
        
        if (visited.has(key) || current.distance > radius) continue;
        visited.add(key);
        
        if (current.distance > 0) { // Don't include the center tile
            neighbors.push(current);
        }
        
        if (current.distance < radius) {
            const hexNeighbors = getHexNeighbors(map, current.row, current.col, height, width);
            for (const neighbor of hexNeighbors) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(neighborKey)) {
                    queue.push({ 
                        row: neighbor.row, 
                        col: neighbor.col, 
                        distance: current.distance + 1 
                    });
                }
            }
        }
    }
    
    return neighbors;
}

// Calculate travel cost between two adjacent tiles
function calculateTravelCost(fromTile: Tile, toTile: Tile, routeType: 'land' | 'sea' | 'river' | 'mountain'): number {
    const baseCost = TERRAIN_COSTS[toTile.terrain] || 2.0;
    
    // Apply route type modifiers
    let modifier = 1.0;
    switch (routeType) {
        case 'sea':
            // Sea routes are faster on water, slower on land
            if (toTile.altitude <= 0 || oceanBiomes.some(biome => biome.name === toTile.terrain)) {
                modifier = 0.5;
            } else {
                modifier = 2.0; // Penalty for going on land
            }
            break;
            
        case 'river':
            // River routes are faster along rivers and water
            if (toTile.features.includes('river') || 
                toTile.features.includes('lake') || 
                toTile.features.includes('source') ||
                toTile.altitude <= 0) {
                modifier = 0.3;
            } else {
                modifier = 1.5; // Small penalty for leaving water
            }
            break;
            
        case 'mountain':
            // Mountain routes are better at high altitude
            if (toTile.altitude > 0.5) {
                modifier = 0.7;
            } else {
                modifier = 1.3;
            }
            break;
            
        case 'land':
        default:
            // Land routes have no special modifiers
            break;
    }
    
    // Apply habitability bonus (better habitability = easier travel)
    const habitabilityBonus = 1.0 - (toTile.habitability * 0.3);
    
    return baseCost * modifier * habitabilityBonus;
}

// Find the best route between two settlements using A* pathfinding
export function findTradeRoute(
    map: Tile[][],
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    routeType: 'land' | 'sea' | 'river' | 'mountain' | 'auto' = 'auto'
): TradeRoute | null {
    const height = map.length;
    const width = map[0].length;
    
    // If auto, determine best route type based on settlements
    if (routeType === 'auto') {
        routeType = determineBestRouteType(map, fromRow, fromCol, toRow, toCol);
    }
    
    const start = { row: fromRow, col: fromCol };
    const goal = { row: toRow, col: toCol };
    
    // A* pathfinding
    const openSet = [start];
    const closedSet = new Set<string>(); // Track visited nodes
    const cameFrom = new Map<string, { row: number; col: number }>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(`${start.row},${start.col}`, 0);
    fScore.set(`${start.row},${start.col}`, heuristic(start, goal));
    
    let iterations = 0;
    const maxIterations = width * height * 2; // Prevent infinite loops
    
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Get node with lowest fScore
        let current = openSet[0];
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            const currentF = fScore.get(`${current.row},${current.col}`) || Infinity;
            const nodeF = fScore.get(`${openSet[i].row},${openSet[i].col}`) || Infinity;
            if (nodeF < currentF) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        // Remove current from open set and add to closed set
        openSet.splice(currentIndex, 1);
        const currentKey = `${current.row},${current.col}`;
        closedSet.add(currentKey);
        
        // Check if we reached the goal
        if (current.row === goal.row && current.col === goal.col) {
            const path = reconstructPath(cameFrom, current);
            const distance = gScore.get(currentKey) || 0;
            const travelTime = calculateTravelTime(distance, routeType);
            const tradeValue = calculateTradeValue(map, fromRow, fromCol, toRow, toCol, distance);
            
            return {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                distance,
                travelTime,
                routeType,
                path,
                tradeValue
            };
        }
        
        // Check neighbors
        const neighbors = getHexNeighbors(map, current.row, current.col, height, width);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            
            // Skip if already processed
            if (closedSet.has(neighborKey)) {
                continue;
            }
            
            const currentTile = map[current.row][current.col];
            const neighborTile = map[neighbor.row][neighbor.col];
            const tentativeG = (gScore.get(currentKey) || 0) + 
                              calculateTravelCost(currentTile, neighborTile, routeType);
            
            const neighborG = gScore.get(neighborKey) || Infinity;
            
            if (tentativeG < neighborG) {
                // Store a copy of the current node to prevent reference issues
                cameFrom.set(neighborKey, { row: current.row, col: current.col });
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + heuristic(neighbor, goal));
                
                // Add to open set if not already there
                if (!openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    openSet.push({ row: neighbor.row, col: neighbor.col });
                }
            }
        }
    }
    
    if (iterations >= maxIterations) {
        console.warn(`A* pathfinding exceeded maximum iterations (${maxIterations}) for route from (${fromRow}, ${fromCol}) to (${toRow}, ${toCol})`);
    }
    
    return null; // No path found
}

// Heuristic function for A* (Manhattan distance)
function heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// Reconstruct path from A* result
function reconstructPath(
    cameFrom: Map<string, { row: number; col: number }>,
    current: { row: number; col: number }
): Array<{ row: number; col: number }> {
    const path: Array<{ row: number; col: number }> = [];
    let node = { ...current };
    const visitedNodes = new Set<string>(); // Prevent infinite loops
    
    // Build path backwards first
    while (true) {
        const nodeKey = `${node.row},${node.col}`;
        
        // Check for circular reference to prevent infinite loops
        if (visitedNodes.has(nodeKey)) {
            console.warn('Circular reference detected in path reconstruction');
            break;
        }
        visitedNodes.add(nodeKey);
        
        path.push({ ...node });
        
        if (!cameFrom.has(nodeKey)) {
            break;
        }
        
        const parent = cameFrom.get(nodeKey)!;
        node = { ...parent }; // Create a copy to avoid reference issues
        
        // Safety check to prevent excessively long paths
        if (path.length > 10000) {
            console.warn('Path reconstruction exceeded maximum length, breaking');
            break;
        }
    }
    
    // Reverse to get correct order (start to goal)
    return path.reverse();
}

// Determine the best route type between two settlements
function determineBestRouteType(
    map: Tile[][],
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
): 'land' | 'sea' | 'river' | 'mountain' {
    const fromTile = map[fromRow][fromCol];
    const toTile = map[toRow][toCol];
    
    // Check if both settlements have good sea access
    if (fromTile.travelBonuses?.seaTravel && toTile.travelBonuses?.seaTravel &&
        fromTile.travelBonuses.seaTravel > 0.8 && toTile.travelBonuses.seaTravel > 0.8) {
        return 'sea';
    }
    
    // Check if both settlements have good river access
    if (fromTile.travelBonuses?.riverTravel && toTile.travelBonuses?.riverTravel &&
        fromTile.travelBonuses.riverTravel > 0.6 && toTile.travelBonuses.riverTravel > 0.6) {
        return 'river';
    }
    
    // Check if both settlements are in mountainous regions
    if (fromTile.travelBonuses?.mountainTravel && toTile.travelBonuses?.mountainTravel &&
        fromTile.travelBonuses.mountainTravel > 0.5 && toTile.travelBonuses.mountainTravel > 0.5) {
        return 'mountain';
    }
    
    // Default to land routes
    return 'land';
}

// Calculate travel time based on distance and route type
function calculateTravelTime(distance: number, routeType: 'land' | 'sea' | 'river' | 'mountain'): number {
    const baseTime = distance;
    
    switch (routeType) {
        case 'sea':
            return baseTime * 0.7; // Faster by sea
        case 'river':
            return baseTime * 0.5; // Fastest by river
        case 'mountain':
            return baseTime * 1.5; // Slower in mountains
        case 'land':
        default:
            return baseTime;
    }
}

// Generate all trade routes for the map
export function generateTradeRoutes(map: Tile[][]): void {
    const height = map.length;
    const width = map[0].length;
    const settlements: Array<{ row: number; col: number; type: string }> = [];
    
    // Find all settlements
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            if (tile.features.includes('city') || 
                tile.features.includes('town') || 
                tile.features.includes('village')) {
                
                let type = 'village';
                if (tile.features.includes('city')) type = 'city';
                else if (tile.features.includes('town')) type = 'town';
                
                settlements.push({ row, col, type });
            }
        }
    }
    
    console.log(`Found ${settlements.length} settlements for trade route generation.`);
    
    // Calculate travel bonuses for all settlements
    for (const settlement of settlements) {
        const tile = map[settlement.row][settlement.col];
        tile.travelBonuses = calculateTravelBonuses(map, settlement.row, settlement.col);
        tile.tradeRoutes = [];
    }
    
    // Generate trade routes between settlements with better filtering
    let routeCount = 0;
    let attemptedRoutes = 0;
    
    for (let i = 0; i < settlements.length; i++) {
        for (let j = i + 1; j < settlements.length; j++) {
            const from = settlements[i];
            const to = settlements[j];
            
            // Calculate straight-line distance
            const straightLineDistance = Math.sqrt(
                Math.pow(from.row - to.row, 2) + Math.pow(from.col - to.col, 2)
            );
            
            // UPDATED: More restrictive maximum distances based on settlement importance
            let maxDistance: number;
            const fromImportance = getSettlementImportance(from.type);
            const toImportance = getSettlementImportance(to.type);
            const maxImportance = Math.max(fromImportance, toImportance);
            
            // Distance limits based on most important settlement in the pair
            if (maxImportance >= 3) { // At least one city
                maxDistance = 25;
            } else if (maxImportance >= 2) { // At least one town
                maxDistance = 15;
            } else { // Both villages
                maxDistance = 8; // Even shorter for village-to-village
            }
            
            // Skip if too far even in straight line
            if (straightLineDistance > maxDistance) {
                continue;
            }
            
            attemptedRoutes++;
            
            // Try to find a route
            const route = findTradeRoute(map, from.row, from.col, to.row, to.col, 'auto');
            
            if (route) {
                // UPDATED: Much stricter viability checks
                const isViable = isRouteViable(route, from.type, to.type, straightLineDistance);
                
                if (isViable) {
                    map[from.row][from.col].tradeRoutes!.push(route);
                    map[to.row][to.col].tradeRoutes!.push({
                        ...route,
                        from: route.to,
                        to: route.from
                    });
                    routeCount++;
                } else {
                    console.log(`Route rejected: ${from.type} at (${from.row},${from.col}) to ${to.type} at (${to.row},${to.col}) - not viable (distance: ${route.distance.toFixed(1)}, value: ${route.tradeValue})`);
                }
            }
        }
    }
    
    console.log(`Generated ${routeCount} viable trade routes out of ${attemptedRoutes} attempted routes.`);
}

// Helper function to get settlement importance for route planning
function getSettlementImportance(type: string): number {
    switch (type) {
        case 'city': return 3;
        case 'town': return 2;
        case 'village': return 1;
        default: return 0;
    }
}

// Check if a route is economically and practically viable
function isRouteViable(
    route: TradeRoute, 
    fromType: string, 
    toType: string, 
    straightLineDistance: number
): boolean {
    const { distance, tradeValue, routeType } = route;
    
    // 1. Distance efficiency check - route shouldn't be too much longer than straight line
    const distanceEfficiency = straightLineDistance / distance;
    const minEfficiency = 0.6; // Route can be at most 67% longer than straight line
    
    if (distanceEfficiency < minEfficiency) {
        return false; // Route is too winding/inefficient
    }
    
    // 2. Minimum trade value thresholds based on settlement types
    let minTradeValue: number;
    const fromImportance = getSettlementImportance(fromType);
    const toImportance = getSettlementImportance(toType);
    const totalImportance = fromImportance + toImportance;
    
    if (totalImportance >= 6) { // City to City
        minTradeValue = 150;
    } else if (totalImportance >= 5) { // City to Town
        minTradeValue = 100;
    } else if (totalImportance >= 4) { // City to Village or Town to Town
        minTradeValue = 60;
    } else if (totalImportance >= 3) { // Town to Village
        minTradeValue = 30;
    } else { // Village to Village
        minTradeValue = 15;
    }
    
    if (tradeValue < minTradeValue) {
        return false; // Not valuable enough
    }
    
    // 3. Distance vs value check - longer routes need higher value per distance
    const valuePerDistance = tradeValue / distance;
    let minValuePerDistance: number;
    
    if (totalImportance >= 5) { // High importance settlements
        minValuePerDistance = 3.0;
    } else if (totalImportance >= 3) { // Medium importance
        minValuePerDistance = 2.0;
    } else { // Low importance
        minValuePerDistance = 1.5;
    }
    
    if (valuePerDistance < minValuePerDistance) {
        return false; // Not efficient enough value for the distance
    }
    
    // 4. Route type appropriateness check
    if (distance > 20 && routeType === 'mountain') {
        return false; // Long mountain routes are impractical
    }
    
    if (distance > 15 && routeType === 'land' && totalImportance < 4) {
        return false; // Long land routes only for important settlements
    }
    
    // 5. Maximum practical distances by route type
    const maxDistanceByType: Record<string, number> = {
        'river': 30,   // Rivers are efficient for longer distances
        'sea': 35,     // Sea routes can be very long
        'land': 20,    // Land routes should be moderate
        'mountain': 15 // Mountain routes should be short
    };
    
    if (distance > maxDistanceByType[routeType]) {
        return false; // Route is too long for its type
    }
    
    return true; // Route passes all viability checks
}

// UPDATED: More realistic trade value calculation
function calculateTradeValue(
    map: Tile[][],
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    distance: number
): number {
    const fromTile = map[fromRow][fromCol];
    const toTile = map[toRow][toCol];
    
    // Base trade value based on settlement types (reduced from previous values)
    let baseValue = 0;
    
    // From settlement value (reduced)
    if (fromTile.features.includes('city')) baseValue += 80;        // Was 100
    else if (fromTile.features.includes('town')) baseValue += 35;   // Was 50
    else if (fromTile.features.includes('village')) baseValue += 12; // Was 20
    
    // To settlement value (reduced)
    if (toTile.features.includes('city')) baseValue += 80;         // Was 100
    else if (toTile.features.includes('town')) baseValue += 35;    // Was 50
    else if (toTile.features.includes('village')) baseValue += 12;  // Was 20
    
    // UPDATED: Stronger distance penalty - exponential falloff
    const distancePenalty = Math.max(0.1, Math.exp(-distance * 0.1));
    
    // Habitability bonus (reduced impact)
    const habitabilityBonus = ((fromTile.habitability + toTile.habitability) / 2) * 0.3; // Was 0.5
    
    // Route type bonus/penalty
    const routeType = determineBestRouteType(map, fromRow, fromCol, toRow, toCol);
    let routeTypeMultiplier = 1.0;
    switch (routeType) {
        case 'river': routeTypeMultiplier = 1.3; break; // Rivers are valuable
        case 'sea': routeTypeMultiplier = 1.2; break;   // Sea routes are good
        case 'land': routeTypeMultiplier = 1.0; break;  // Land is baseline
        case 'mountain': routeTypeMultiplier = 0.7; break; // Mountain routes are harder
    }
    
    const finalValue = Math.floor(baseValue * distancePenalty * (1 + habitabilityBonus) * routeTypeMultiplier);
    
    return Math.max(1, finalValue); // Ensure minimum value of 1
}