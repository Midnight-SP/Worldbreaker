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


export async function generateMap(width: number, height: number, plates: number, latitudeMode: 'full' | 'partial') {
    // Generate a new random seed for each map
    const randomSeed = Math.random().toString();

    // Use the random seed to generate seeds for different noise functions
    const baseSeed = seedrandom(randomSeed + 'base')();
    const detailSeed1 = seedrandom(randomSeed + 'detail1')();
    const detailSeed2 = seedrandom(randomSeed + 'detail2')();
    const temperatureSeed = seedrandom(randomSeed + 'temperature')();
    const humiditySeed = seedrandom(randomSeed + 'humidity')();

    // Generate and distort the plate map
    let plateMap = assignPlatesUsingVoronoi(width, height, plates);
    plateMap = distortPlateBoundaries(plateMap, width, height);

    const plateCenters = Array.from({ length: plates }, (_, i) => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        drift: driftDirections[Math.floor(Math.random() * driftDirections.length)],
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

    // Lower the altitude of tiles near the edges to create oceans
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
                const factor = borderWidth > 0 ? distanceToEdge / borderWidth : 0; // Avoid division by zero
                map[row][col].altitude = Math.max(-1, map[row][col].altitude * factor - (1 - factor)); // Lower altitude
            }
        }
    }

    // Assign plates to tiles
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            map[row][col].plate = plateMap[row][col];
        }
    }

    // Randomly assign sources to some tiles with altitude >= 0.4 and ensure no neighboring sources or ocean biomes
    const sourceCount = Math.floor((width * height) / 100); // Adjust the density of sources
    let assignedSources = 0;

    const maxRetries = 1000; // Maximum number of retries to assign sources
    let retries = 0;

    while (assignedSources < sourceCount && retries < maxRetries) {
        const row = Math.floor(Math.random() * height);
        const col = Math.floor(Math.random() * width);
    
        const neighbors = neighborsCache[`${row},${col}`];
    
        if (
            !map[row][col].features.includes('source') &&
            !neighbors.some(neighbor =>
                map[neighbor.row][neighbor.col].features.includes('source') ||
                oceanBiomes.some(ocean => ocean.name === map[neighbor.row][neighbor.col].terrain)
            )
        ) {
            map[row][col].features.push('source');
            assignedSources++;
        }
    
        retries++;
    }
    
    if (retries >= maxRetries) {
        console.warn(`Source assignment stopped after ${maxRetries} retries. Assigned ${assignedSources} sources out of ${sourceCount}.`);
    }

    console.log('Identifying plate boundaries...');
    const boundaries = identifyPlateBoundaries(map, height, width, plateCenters);
    console.log(`Found ${boundaries.length} plate boundaries.`);

    console.log('Applying plate boundary effects...');
    applyPlateBoundaryEffects(map, boundaries, plateSizes);
    console.log('Plate boundary effects applied.');

    console.log('Smoothing map...');
    smoothMap(map);
    console.log('Map smoothed.');

    console.log('Generating rivers...');
    const riverPaths = generateRivers(map, assignedSources);
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
    
                if (!hasNeighboringRiver) {
                    tile.features = tile.features.filter(feature => feature !== 'source'); // Remove 'source'
                    tile.features.push('lake');
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
    
                if (!neighborsOceanBiome && hasNeighboringRiverOrSource) {
                    tile.features.push('lake'); // Add 'lake' feature
                }
            }
        }
    }

    console.log('Applying feature effects...');
    applyFeatureEffects(map, height, width);
    console.log('Feature effects applied.');

    console.log('Adjusting vegetation based on water proximity...');
    adjustVegetationBasedOnWater(map, height, width);
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

    // Generate villages based on habitability
    let assignedVillages = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            if (tile.altitude <= 0 || tile.features.includes('village')) continue;
    
            const neighbors = neighborsCache[`${row},${col}`];
            const hasNeighboringVillage = neighbors.some(
                neighbor => map[neighbor.row][neighbor.col].features.includes('village')
            );
    
            const hasVillageInTwoTileRange = neighbors.some(neighbor => {
                const secondLevelNeighbors = neighborsCache[`${neighbor.row},${neighbor.col}`];
                return secondLevelNeighbors.some(
                    secondNeighbor => map[secondNeighbor.row][secondNeighbor.col].features.includes('village')
                );
            });
    
            if (!hasNeighboringVillage && !hasVillageInTwoTileRange && tile.habitability > 0.75) {
                if (Math.random() < 0.5) {
                    tile.features.push('village');
                    assignedVillages++;
                }
            }
        }
    }

    console.log(`Generated ${assignedVillages} villages.`);

    // Convert villages with habitability > 0.9 into cities
    let convertedCities = 0;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];

            if (tile.features.includes('village') && tile.habitability >= 0.85) {
                tile.features = tile.features.filter(feature => feature !== 'village'); // Remove 'village'
                tile.features.push('city'); // Add 'city'
                convertedCities++;
            }
        }
    }

    console.log(`Converted ${convertedCities} villages into cities.`);

    return { map }; // Return both map and riverPaths
}