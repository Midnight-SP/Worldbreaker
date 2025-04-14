import { landBiomes, oceanBiomes } from './biomes';

// Determine the closest biome based on parameters
export function determineTerrain(altitude: number, temperature: number, humidity: number): string {
    const biomes = altitude >= 0 ? landBiomes : oceanBiomes; // Use land or ocean biomes based on altitude

    let closestBiome = biomes[0];
    let smallestDistance = calculateDistance(altitude, temperature, humidity, closestBiome);

    for (const biome of biomes) {
        const distance = calculateDistance(altitude, temperature, humidity, biome);
        if (distance < smallestDistance) {
            closestBiome = biome;
            smallestDistance = distance;
        }
    }

    return closestBiome.name;
}

// Calculate the distance between a tile's parameters and a biome's parameters
function calculateDistance(altitude: number, temperature: number, humidity: number, biome: { altitude: number; temperature: number; humidity: number }): number {
    return Math.sqrt(
        Math.pow(altitude - biome.altitude, 2) +
        Math.pow(temperature - biome.temperature, 2) +
        Math.pow(humidity - biome.humidity, 2)
    );
}