import { driftDirections } from './driftDirections';
import { determineClimateZone, determineTerrain } from './terrain';
import { applyPlateBoundaryEffects, smoothMap, distortPlateBoundaries } from './smoothing';
import { identifyPlateBoundaries, assignPlatesUsingVoronoi, calculatePlateSizes, calculateHabitability } from './tileGeneration';
import { generateRivers } from './rivers';
import { applyRainShadowEffect } from './rainShadowEffect';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';
import { applyFeatureEffects } from './applyFeatureEffects';
import { adjustVegetationBasedOnWater, findNearestWaterDistance } from './vegetation';
import seedrandom from 'seedrandom';
import { Map } from './types';
import { identifyGeographicRegions } from './geographicRegions';
import { NameGenerator } from './nameGenerator';
import { generateTradeRoutes } from './tradeRoutes';


export async function generateMap(
    width: number, 
    height: number, 
    plates: number, 
    latitudeMode: 'full' | 'partial',
    inputSeed?: string
) {
    // Use provided seed or generate a random one
    const masterSeed = inputSeed || Date.now().toString();
    console.log(`Using seed: ${masterSeed}`);

    // Create name generator with the master seed
    const nameGenerator = new NameGenerator(masterSeed);

    // Create a master random number generator
    const masterRng = seedrandom(masterSeed);

    // Generate seeds for different noise functions using the master RNG
    const baseSeed = masterRng();
    const detailSeed1 = masterRng();
    const detailSeed2 = masterRng();
    const temperatureSeed = masterRng();
    const humiditySeed = masterRng();

    // Generate and distort the plate map using seeded random
    let plateMap = assignPlatesUsingVoronoi(width, height, plates, masterRng);
    plateMap = distortPlateBoundaries(plateMap, width, height, masterRng);

    // Create plate centers with names
    const plateCenters = Array.from({ length: plates }, (_, i) => ({
        x: Math.floor(masterRng() * width),
        y: Math.floor(masterRng() * height),
        drift: driftDirections[Math.floor(masterRng() * driftDirections.length)],
        name: nameGenerator.getPlateName(),
    }));

    // Calculate plate sizes
    const plateSizes = calculatePlateSizes(plateMap, plates);

    // Divide the map into chunks for parallel processing
    const chunks: Array<{ rowIndex: number; colIndex: number }[]> = [];
    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
        const chunk = [];
        for (let colIndex = 0; colIndex < width; colIndex++) {
            chunk.push({ rowIndex, colIndex });
        }
        chunks.push(chunk);
    }

    // Create workers and process chunks
    const workers = chunks.map((chunk) => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('./tileWorker.js', import.meta.url));
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
            worker.onerror = (error) => {
                reject(error);
                worker.terminate();
            };
            worker.postMessage({
                chunk,
                height,
                width,
                plateCenters,
                latitudeMode,
                seeds: {
                    baseSeed,
                    detailSeed1,
                    detailSeed2,
                    temperatureSeed,
                    humiditySeed,
                },
            });
        });
    });

    // Wait for all workers to complete
    const results = await Promise.all(workers);

    // Combine results into a single map
    const map: Map = Array.from({ length: height }, () => Array(width).fill(null));
    results.forEach((result: any) => {
        result.forEach(({ rowIndex, colIndex, tile }: any) => {
            map[rowIndex][colIndex] = tile;
        });
    });

    // Perform post-processing (e.g., neighbors, features, smoothing)
    const neighborsCache: Record<string, Array<{ row: number; col: number }>> = {};
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            neighborsCache[`${row},${col}`] = getHexNeighbors(map, row, col, height, width);
        }
    }
    
    // Calculate distanceToWater and habitability after map initialization
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const distanceToWater = findNearestWaterDistance(map, row, col, height, width);
            map[row][col].habitability = calculateHabitability(
                map[row][col].altitude,
                map[row][col].temperature,
                map[row][col].humidity,
                distanceToWater,
                map[row][col].vegetation
            );
        }
    }

    // MOVED: Lower the altitude of tiles near the edges to create oceans BEFORE source assignment
    const borderWidth = Math.min(width, height) * 0.1; // 10% of the smaller dimension
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const distanceToEdge = Math.min(
                row, 
                col, 
                height - row - 1, 
                width - col - 1
            );

            if (distanceToEdge < borderWidth) {
                const factor = borderWidth > 0 ? distanceToEdge / borderWidth : 0;
                map[row][col].altitude = Math.max(-1, map[row][col].altitude * factor - (1 - factor));
            }
        }
    }

    // Assign plates to tiles with names
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            map[row][col].plate = plateMap[row][col];
            map[row][col].plateName = plateCenters[plateMap[row][col]].name;
        }
    }

    // Create seeded RNGs for different processes
    const sourceRng = seedrandom(masterSeed + 'sources');
    const villageRng = seedrandom(masterSeed + 'villages');
    const cityRng = seedrandom(masterSeed + 'cities');
    const smoothingRng = seedrandom(masterSeed + 'smoothing');
    const boundaryRng = seedrandom(masterSeed + 'boundaries');
    const riverRng = seedrandom(masterSeed + 'rivers');
    const vegetationRng = seedrandom(masterSeed + 'vegetation');

    // MOVED: Randomly assign sources AFTER border ocean creation and with altitude check
    const sourceCount = Math.floor((width * height) / 100);
    let assignedSources = 0;
    const maxRetries = 1000;
    let retries = 0;

    while (assignedSources < sourceCount && retries < maxRetries) {
        const row = Math.floor(sourceRng() * height);
        const col = Math.floor(sourceRng() * width);
        const tile = map[row][col];
        
        const neighbors = neighborsCache[`${row},${col}`];
    
        if (
            tile.altitude > 0 && // FIXED: Only place sources on land tiles (altitude > 0)
            !tile.features.includes('source') &&
            !neighbors.some(neighbor =>
                map[neighbor.row][neighbor.col].features.includes('source') ||
                oceanBiomes.some(ocean => ocean.name === map[neighbor.row][neighbor.col].terrain)
            )
        ) {
            tile.features.push('source');
            // NAME SOURCES with RIVER names since they will generate rivers
            tile.sourceName = nameGenerator.getFeatureName('river');
            assignedSources++;
        }
    
        retries++;
    }
    
    if (retries >= maxRetries) {
        console.warn(`Source assignment stopped after ${maxRetries} retries. Assigned ${assignedSources} sources out of ${sourceCount}.`);
    }

    // Name volcanoes early too (before any processing that might reference them)
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            
            if (tile.features.includes('volcano')) {
                tile.volcanoName = nameGenerator.getFeatureName('volcano');
            }
        }
    }

    console.log('Identifying plate boundaries...');
    const boundaries = identifyPlateBoundaries(map, height, width, plateCenters);
    console.log(`Found ${boundaries.length} plate boundaries.`);

    console.log('Applying plate boundary effects...');
    applyPlateBoundaryEffects(map, boundaries, plateSizes, boundaryRng);
    console.log('Plate boundary effects applied.');

    console.log('Smoothing map...');
    smoothMap(map, smoothingRng);
    console.log('Map smoothed.');

    console.log('Generating rivers...');
    const riverPaths = generateRivers(map, assignedSources, riverRng);
    console.log(`Generated ${riverPaths.length} rivers.`);

    // Turn sources into lakes if they don't neighbor any rivers
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
    
            if (tile.features.includes('source')) {
                const neighbors = neighborsCache[`${row},${col}`];
    
                // Check if none of the neighbors have a river
                const hasNeighboringRiver = neighbors.some(
                    (neighbor) => map[neighbor.row][neighbor.col].features.includes('river')
                );
    
                // Only create lakes on LAND tiles (altitude > 0) - should already be guaranteed since sources are only on land
                if (!hasNeighboringRiver && tile.altitude > 0) {
                    tile.features = tile.features.filter(feature => feature !== 'source');
                    tile.features.push('lake');
                    
                    // Generate a proper lake name instead of using the river name
                    tile.lakeName = nameGenerator.getFeatureName('lake');
                    delete tile.sourceName;
                    
                    console.log(`Source at (${row}, ${col}) turned into a lake because it doesn't neighbor any rivers.`);
                }
            }
        }
    }

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
    
            if (tile.features.includes('river')) {
                const neighbors = neighborsCache[`${row},${col}`];
    
                // Check if the tile doesn't neighbor an ocean biome and has exactly one neighboring river or source
                const hasNeighboringRiverOrSource = neighbors.filter(
                    (neighbor) => map[neighbor.row][neighbor.col].features.includes('river') || map[neighbor.row][neighbor.col].features.includes('source')
                ).length === 1;
    
                const neighborsOceanBiome = neighbors.some((neighbor) =>
                    oceanBiomes.some((ocean) => ocean.name === map[neighbor.row][neighbor.col].terrain)
                );
    
                // FIXED: Only create lakes on LAND tiles (altitude > 0) that don't neighbor ocean biomes
                if (!neighborsOceanBiome && hasNeighboringRiverOrSource && tile.altitude > 0) {
                    tile.features.push('lake');
                    
                    // Generate a proper lake name instead of using the river name
                    tile.lakeName = nameGenerator.getFeatureName('lake');
                }
            }
        }
    }

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.features = Array.from(new Set(tile.features));
        }
    }

    console.log('Applying feature effects...');
    applyFeatureEffects(map, height, width);
    console.log('Feature effects applied.');

    console.log('Adjusting vegetation based on water proximity...');
    adjustVegetationBasedOnWater(map, height, width, vegetationRng);
    console.log('Vegetation adjustment complete.');

    console.log('Applying rain shadow effect...');
    applyRainShadowEffect(map);
    console.log('Rain shadow effect applied.');

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.terrain = determineTerrain(tile.altitude, tile.temperature, tile.humidity);
        }
    }

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.climateZone = determineClimateZone(tile.latitude, tile.temperature, tile.humidity);
        }
    }

    // Generate settlements with names (each type has its own table)
    let assignedVillages = 0;
    let assignedTowns = 0;
    let assignedCities = 0;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            if (tile.altitude <= 0) continue;

            const neighbors = neighborsCache[`${row},${col}`];
            const hasNeighboringSettlement = neighbors.some(
                neighbor => ['village', 'town', 'city'].some(f => map[neighbor.row][neighbor.col].features.includes(f))
            );

            const hasSettlementInTwoTileRange = neighbors.some(neighbor => {
                const secondLevelNeighbors = neighborsCache[`${neighbor.row},${neighbor.col}`];
                return secondLevelNeighbors.some(
                    secondNeighbor => ['village', 'town', 'city'].some(f => map[secondNeighbor.row][secondNeighbor.col].features.includes(f))
                );
            });

            if (!hasNeighboringSettlement && !hasSettlementInTwoTileRange) {
                if (tile.habitability > 0.85) {
                    if (cityRng() < 0.5) {
                        const cityName = nameGenerator.getSettlementName('city');
                        tile.features.push('city');
                        tile.cityName = cityName;
                        assignedCities++;
                    }
                } else if (tile.habitability > 0.75) {
                    if (villageRng() < 0.2) {
                        const townName = nameGenerator.getSettlementName('town');
                        tile.features.push('town');
                        tile.townName = townName;
                        assignedTowns++;
                    }
                } else if (tile.habitability > 0.65) {
                    if (villageRng() < 0.1) {
                        const villageName = nameGenerator.getSettlementName('village');
                        tile.features.push('village');
                        tile.villageName = villageName;
                        assignedVillages++;
                    }
                }
            }
        }
    }

    // Add names to remaining lakes (those not formed from sources/rivers)
    // Remove the duplicate naming that was happening here
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            
            // Only generate new lake names for lakes that don't already have names
            if (tile.features.includes('lake') && !tile.lakeName) {
                tile.lakeName = nameGenerator.getFeatureName('lake');
            }

            if (tile.features.includes('volcano') && !tile.volcanoName) {
                tile.volcanoName = nameGenerator.getFeatureName('volcano');
            }
            
            // NOTE: Removed duplicate volcano and source naming since they're now named earlier
        }
    }

    console.log(`Generated ${assignedVillages} villages, ${assignedTowns} towns, and ${assignedCities} cities.`);

    // Identify geographic regions with names
    console.log('Identifying geographic regions...');
    identifyGeographicRegions(map, masterSeed);
    console.log('Geographic regions identified.');

    // NEW: Generate trade routes
    console.log('Generating trade routes...');
    generateTradeRoutes(map);
    console.log('Trade routes generated.');

    return { 
        map, 
        seed: masterSeed
    };
}