import { driftDirections } from './driftDirections';
import { determineTerrain } from './terrain';
import { applyContinentalDrift, smoothMap } from './smoothing';
import { generateTile, findClosestPlate } from './tileGeneration';
import { generateRivers } from './rivers';
import { applyRainShadowEffect } from './rainShadowEffect';

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

    applyContinentalDrift(map, plateCenters, width);
    smoothMap(map);
    const riverPaths = generateRivers(map, Math.floor((width * height) / 100)); // Generate rivers
    applyRainShadowEffect(map);

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.terrain = determineTerrain(tile.altitude, tile.temperature, tile.humidity);
        }
    }

    return { map, riverPaths }; // Return both map and riverPaths
}