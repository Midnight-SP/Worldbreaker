import { driftDirections } from './driftDirections';
import { determineTerrain } from './terrain';
import { applyContinentalDrift, smoothMap } from './smoothing';
import { generateTile, findClosestPlate } from './tileGeneration';
import { generateRivers } from './rivers';
import { applyRainShadowEffect } from './rainShadowEffect';
import { getHexNeighbors } from './hexNeighbors';
import { oceanBiomes } from './biomes';
import { applyFeatureEffects } from './applyFeatureEffects';
import { adjustVegetationBasedOnWater } from './vegetation';

export function generateMap(width: number, height: number, plates: number) {
    const plateCenters = Array.from({ length: plates }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        drift: driftDirections[Math.floor(Math.random() * driftDirections.length)],
    }));

    const map = Array.from({ length: height }, (_, rowIndex) =>
        Array(width).fill(null).map((_, colIndex) => {
            const tile = generateTile(rowIndex, colIndex, height);
            const closestPlate = findClosestPlate(colIndex, rowIndex, plateCenters, width);
            return { ...tile, plate: closestPlate };
        })
    );

    // Randomly assign sources to some tiles with altitude >= 0.4 and ensure no neighboring sources or ocean biomes
    const sourceCount = Math.floor((width * height) / 100); // Adjust the density of sources
    let assignedSources = 0;

    const maxRetries = 1000; // Maximum number of retries to assign sources
    let retries = 0;

    while (assignedSources < sourceCount && retries < maxRetries) {
        const row = Math.floor(Math.random() * height);
        const col = Math.floor(Math.random() * width);
    
        // Debug log for the current tile being checked
        console.log(`Checking tile at (${row}, ${col}) with altitude ${map[row][col].altitude}`);
    
        if (
            !map[row][col].features.includes('source') &&
            !getHexNeighbors(map, row, col, height, width).some(neighbor =>
                map[neighbor.row][neighbor.col].features.includes('source') ||
                oceanBiomes.some(ocean => ocean.name === map[neighbor.row][neighbor.col].terrain)
            )
        ) {
            map[row][col].features.push('source');
            assignedSources++;
            console.log(`Source assigned at (${row}, ${col})`);
        } else {
            console.log(`Tile at (${row}, ${col}) skipped: does not meet source criteria.`);
        }
    
        retries++;
    }
    
    if (retries >= maxRetries) {
        console.warn(`Source assignment stopped after ${maxRetries} retries. Assigned ${assignedSources} sources out of ${sourceCount}.`);
    }

    console.log('Applying continental drift...');
    applyContinentalDrift(map, plateCenters, width);
    console.log('Continental drift applied.');

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
                const neighbors = getHexNeighbors(map, row, col, height, width);
    
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
                const neighbors = getHexNeighbors(map, row, col, height, width);
    
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

    return { map, riverPaths }; // Return both map and riverPaths
}