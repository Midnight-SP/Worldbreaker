import { driftDirections } from './driftDirections';
import { determineTerrain } from './terrain';
import { applyContinentalDrift, smoothMap } from './smoothing';
import { generateTile, findClosestContinent } from './tileGeneration';

export function generateMap(width: number, height: number, continents: number) {
    const continentCenters = Array.from({ length: continents }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        drift: driftDirections[Math.floor(Math.random() * driftDirections.length)],
    }));

    const map = Array.from({ length: height }, (_, rowIndex) =>
        Array(width).fill(null).map((_, colIndex) => {
            const tile = generateTile(rowIndex, colIndex, height);
            const closestContinent = findClosestContinent(colIndex, rowIndex, continentCenters);
            return { ...tile, continent: closestContinent };
        })
    );

    applyContinentalDrift(map, continentCenters);
    smoothMap(map);

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            tile.terrain = determineTerrain(tile.altitude, tile.temperature, tile.humidity);
        }
    }

    return map;
}