import { landBiomes, oceanBiomes, climateZones } from './biomes';

// Determine the closest biome based on parameters
export function determineTerrain(altitude: number, temperature: number, humidity: number): string {
    const biomes = altitude >= 0 ? landBiomes : oceanBiomes; // Use land or ocean biomes based on altitude

    let closestBiome = biomes[0];
    let smallestDistance = calculateBiomeDistance(altitude, temperature, humidity, closestBiome);

    for (const biome of biomes) {
        const distance = calculateBiomeDistance(altitude, temperature, humidity, biome);
        if (distance < smallestDistance) {
            closestBiome = biome;
            smallestDistance = distance;
        }
    }

    return closestBiome.name;
}

export function determineClimateZone(latitude: number, temperature: number, humidity: number): string {
    let closestClimateZone = climateZones[0];
    let smallestDistance = calculateClimateDistance(latitude, temperature, humidity, closestClimateZone);

    for (const climateZone of climateZones) {
        const distance = calculateClimateDistance(Math.abs(latitude), temperature, humidity, climateZone);
        if (distance < smallestDistance) {
            closestClimateZone = climateZone;
            smallestDistance = distance;
        }
    }

    return closestClimateZone.name;
}

// Calculate the distance between a tile's parameters and a biome's parameters
function calculateBiomeDistance(altitude: number, temperature: number, humidity: number, biome: { altitude: number; temperature: number; humidity: number }): number {
    return Math.sqrt(
        Math.pow(altitude - biome.altitude, 2) +
        Math.pow(temperature - biome.temperature, 2) +
        Math.pow(humidity - biome.humidity, 2)
    );
}

function calculateClimateDistance(latitude: number, temperature: number, humidity: number, climateZone: { latitude: number; temperature: number; humidity: number }): number {
    return Math.sqrt(
        1.5 * Math.pow(latitude - climateZone.latitude, 2) +
        Math.pow(temperature - climateZone.temperature, 2) +
        Math.pow(humidity - climateZone.humidity, 2)
    );
}