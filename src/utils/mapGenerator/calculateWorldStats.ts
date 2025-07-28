import { oceanBiomes, landBiomes } from "./biomes";
import { Map } from "./types";
import { getGeographicRegionStats } from "./geographicRegions";

export const calculateWorldStats = (map: Map) => {
    const totalTiles = map.length * map[0].length;
    let totalAltitude = 0;
    let totalTemperature = 0;
    let totalHumidity = 0;
    let totalVegetation = 0;
    let totalHabitability = 0;
    let oceanTiles = 0;
    let sourceCount = 0;
    let lakeCount = 0;
    let volcanoCount = 0;
    let villageCount = 0;
    let townCount = 0;
    let cityCount = 0;
    const landBiomeCounts: Record<string, number> = {};
    const oceanBiomeCounts: Record<string, number> = {};
    
    // NEW: Trade route statistics
    const allTradeRoutes: Array<{
        from: { row: number; col: number; name: string; type: string };
        to: { row: number; col: number; name: string; type: string };
        distance: number;
        routeType: string;
        tradeValue: number;
    }> = [];
    const processedRoutes = new Set<string>();

    map.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            totalAltitude += tile.altitude;
            totalTemperature += tile.temperature;
            totalHumidity += tile.humidity;
            totalVegetation += tile.vegetation;
            totalHabitability += tile.habitability;

            // Check if tile is ocean
            const isOceanTile = oceanBiomes.some(biome => biome.name === tile.terrain);
            if (isOceanTile) {
                oceanTiles++;
                oceanBiomeCounts[tile.terrain] = (oceanBiomeCounts[tile.terrain] || 0) + 1;
            } else {
                landBiomeCounts[tile.terrain] = (landBiomeCounts[tile.terrain] || 0) + 1;
            }

            if (tile.features.includes('source')) sourceCount++;
            if (tile.features.includes('lake')) lakeCount++;
            if (tile.features.includes('volcano')) volcanoCount++;
            if (tile.features.includes('village')) villageCount++;
            if (tile.features.includes('town')) townCount++;
            if (tile.features.includes('city')) cityCount++;

            // NEW: Collect trade routes
            if (tile.tradeRoutes && tile.tradeRoutes.length > 0) {
                tile.tradeRoutes.forEach(route => {
                    // Create a unique key for this route to avoid duplicates
                    const routeKey = `${Math.min(route.from.row, route.to.row)}-${Math.min(route.from.col, route.to.col)}-${Math.max(route.from.row, route.to.row)}-${Math.max(route.from.col, route.to.col)}`;
                    
                    if (!processedRoutes.has(routeKey)) {
                        processedRoutes.add(routeKey);
                        
                        // Get settlement names and types
                        const fromTile = map[route.from.row][route.from.col];
                        const toTile = map[route.to.row][route.to.col];
                        
                        const getSettlementInfo = (tile: any, row: number, col: number) => {
                            let name = `(${col}, ${row})`;
                            let type = 'settlement';
                            
                            if (tile.features.includes('city')) {
                                type = 'city';
                                name = tile.cityName || `City at (${col}, ${row})`;
                            } else if (tile.features.includes('town')) {
                                type = 'town';
                                name = tile.townName || `Town at (${col}, ${row})`;
                            } else if (tile.features.includes('village')) {
                                type = 'village';
                                name = tile.villageName || `Village at (${col}, ${row})`;
                            }
                            
                            return { name, type };
                        };
                        
                        const fromInfo = getSettlementInfo(fromTile, route.from.row, route.from.col);
                        const toInfo = getSettlementInfo(toTile, route.to.row, route.to.col);
                        
                        allTradeRoutes.push({
                            from: {
                                row: route.from.row,
                                col: route.from.col,
                                name: fromInfo.name,
                                type: fromInfo.type
                            },
                            to: {
                                row: route.to.row,
                                col: route.to.col,
                                name: toInfo.name,
                                type: toInfo.type
                            },
                            distance: route.distance,
                            routeType: route.routeType,
                            tradeValue: route.tradeValue
                        });
                    }
                });
            }
        });
    });

    const averageAltitude = totalAltitude / totalTiles;
    const averageTemperature = totalTemperature / totalTiles;
    const averageHumidity = totalHumidity / totalTiles;
    const averageVegetation = totalVegetation / totalTiles;
    const averageHabitability = totalHabitability / totalTiles;
    const oceanCoverage = (oceanTiles / totalTiles) * 100;

    // Get top 3 land biomes
    const topLandBiomes = Object.entries(landBiomeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([biome, count]) => ({
            biome,
            percentage: ((count / totalTiles) * 100).toFixed(1),
        }));

    // Get top 3 ocean biomes
    const topOceanBiomes = Object.entries(oceanBiomeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([biome, count]) => ({
            biome,
            percentage: ((count / totalTiles) * 100).toFixed(1),
        }));

    // NEW: Get top 5 trade routes by value
    const topTradeRoutes = allTradeRoutes
        .sort((a, b) => b.tradeValue - a.tradeValue)
        .slice(0, 5);

    // Get geographic regions information - much simpler now!
    const geographicRegions = getGeographicRegionStats(map);
    const continents = geographicRegions.filter(r => r.type === 'continent');
    const islands = geographicRegions.filter(r => r.type === 'island');
    const archipelagos = geographicRegions.filter(r => r.type === 'archipelago');
    const oceans = geographicRegions.filter(r => r.type === 'ocean');
    const seas = geographicRegions.filter(r => r.type === 'sea');
    const bays = geographicRegions.filter(r => r.type === 'bay');
    const coastalWaters = geographicRegions.filter(r => r.type === 'coastal-waters');

    return {
        averageAltitude,
        averageTemperature,
        averageHumidity,
        averageVegetation,
        averageHabitability,
        oceanCoverage,
        sourceCount,
        lakeCount,
        volcanoCount,
        villageCount,
        townCount,
        cityCount,
        topLandBiomes,
        topOceanBiomes,
        topTradeRoutes, // NEW: Add top trade routes
        totalTradeRoutes: allTradeRoutes.length, // NEW: Add total count
        geographicRegionCount: geographicRegions.length,
        continentCount: continents.length,
        islandCount: islands.length,
        archipelagoCount: archipelagos.length,
        oceanCount: oceans.length,
        seaCount: seas.length,
        bayCount: bays.length,
        coastalWaterCount: coastalWaters.length,
        totalLandRegions: continents.length + islands.length + archipelagos.length,
        totalWaterRegions: oceans.length + seas.length + bays.length + coastalWaters.length,
    };
};