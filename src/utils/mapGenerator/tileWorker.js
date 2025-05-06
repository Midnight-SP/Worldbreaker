import { createNoise2D } from 'simplex-noise';
import seedrandom from 'seedrandom'; // Use seedrandom for consistent seeded noise
import { generateTile } from './tileGeneration';

self.onmessage = (event) => {
    const { chunk, height, width, plateCenters, latitudeMode, seeds } = event.data;

    // Initialize noise functions with the provided seeds
    const baseNoise = createNoise2D(seedrandom(seeds.baseSeed));
    const detailNoise1 = createNoise2D(seedrandom(seeds.detailSeed1));
    const detailNoise2 = createNoise2D(seedrandom(seeds.detailSeed2));
    const temperatureNoise = createNoise2D(seedrandom(seeds.temperatureSeed));
    const humidityNoise = createNoise2D(seedrandom(seeds.humiditySeed));

    const result = chunk.map(({ rowIndex, colIndex }) => ({
        rowIndex,
        colIndex,
        tile: generateTile(
            rowIndex,
            colIndex,
            height,
            width,
            plateCenters,
            latitudeMode,
            baseNoise,
            detailNoise1,
            detailNoise2,
            temperatureNoise,
            humidityNoise,
            () => null // Placeholder for distanceToWater
        ),
    }));

    self.postMessage(result);
};