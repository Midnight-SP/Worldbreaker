import { oceanBiomes } from "./biomes";

export const calculateWorldStats = (map: Array<Array<{ altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; features: string[] }>>) => {
    const totalTiles = map.length * map[0].length;
    let totalAltitude = 0;
    let totalTemperature = 0;
    let totalHumidity = 0;
    let totalVegetation = 0;
    let oceanTiles = 0;
    let sourceCount = 0;
    let lakeCount = 0;
    let volcanoCount = 0;
    const biomeCounts: Record<string, number> = {};

    map.forEach(row => {
        row.forEach(tile => {
            totalAltitude += tile.altitude;
            totalTemperature += tile.temperature;
            totalHumidity += tile.humidity;
            totalVegetation += tile.vegetation;

            if (oceanBiomes.some(biome => biome.name === tile.terrain)) {
                oceanTiles++;
            }

            if (tile.features.includes('source')) {
                sourceCount++;
            }

            if (tile.features.includes('lake')) {
                lakeCount++;
            }

            if (tile.features.includes('volcano')) {
                volcanoCount++;
            }

            biomeCounts[tile.terrain] = (biomeCounts[tile.terrain] || 0) + 1;
        });
    });

    const averageAltitude = totalAltitude / totalTiles;
    const averageTemperature = totalTemperature / totalTiles;
    const averageHumidity = totalHumidity / totalTiles;
    const averageVegetation = totalVegetation / totalTiles;
    const oceanCoverage = (oceanTiles / totalTiles) * 100;

    const sortedBiomes = Object.entries(biomeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([biome, count]) => ({
            biome,
            percentage: ((count / totalTiles) * 100).toFixed(2), // Calculate percentage
        }));

    return {
        averageAltitude,
        averageTemperature,
        averageHumidity,
        averageVegetation,
        oceanCoverage,
        sourceCount,
        lakeCount,
        volcanoCount,
        topBiomes: sortedBiomes,
    };
};