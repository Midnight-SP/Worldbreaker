import { determineTerrain } from './terrain';
import { getHexNeighbors } from './hexNeighbors';

export function generateTile(
    rowIndex: number,
    colIndex: number,
    totalRows: number,
    totalCols: number,
    plateCenters: Array<{ x: number; y: number; drift: { dx: number; dy: number } }>,
    latitudeMode: 'full' | 'partial',
    baseNoise: (x: number, y: number) => number,
    detailNoise1: (x: number, y: number) => number,
    detailNoise2: (x: number, y: number) => number,
    temperatureNoise: (x: number, y: number) => number,
    humidityNoise: (x: number, y: number) => number,
    findNearestWaterDistance: (row: number, col: number) => number | null // Add water distance function
): { 
    altitude: number; 
    temperature: number; 
    humidity: number; 
    vegetation: number; 
    terrain: string; 
    latitude: number; 
    plate: number; 
    features: string[]; 
    habitability: number; // Add habitability
} {
    const baseScale = 0.05; // Base scale for large landmasses
    const detailScale1 = 0.1; // Scale for finer details
    const detailScale2 = 0.2; // Scale for even finer details
    const climateScale = 0.02; // Scale for temperature and humidity noise

    const baseNoiseValue = baseNoise(rowIndex * baseScale, colIndex * baseScale);
    const detailNoiseValue1 = detailNoise1(rowIndex * detailScale1, colIndex * detailScale1) * 0.3; // 30% amplitude
    const detailNoiseValue2 = detailNoise2(rowIndex * detailScale2, colIndex * detailScale2) * 0.1; // 10% amplitude

    // Combine noise layers to calculate the final noise value
    const combinedNoiseValue = baseNoiseValue + detailNoiseValue1 + detailNoiseValue2;

    // Adjust latitude based on the selected mode
    const baseLatitude = latitudeMode === 'full'
        ? 1 - (rowIndex / (totalRows - 0.5)) * 2 // Original mode: 1 to -1
        : 1 - (rowIndex / totalRows); // New mode: 1 to 0

    const latitudeOffset = (colIndex % 2 === 1) ? (1 / totalRows) : 0; // Offset for even/odd columns
    const latitude = baseLatitude - latitudeOffset;

    // Find the closest plate and apply tectonic effects
    const closestPlate = findClosestPlate(colIndex, rowIndex, plateCenters, totalCols);
    const plateEffect = (closestPlate % 2 === 0 ? 0.2 : -0.2) * combinedNoiseValue; // Simulate plate uplift or subsidence

    // Combine noise and plate effects to calculate altitude
    const altitude = Math.max(-1, Math.min(1, combinedNoiseValue + plateEffect));

    // Calculate temperature based on latitude and noise
    const temperatureNoiseValue = temperatureNoise(rowIndex * climateScale, colIndex * climateScale) * 0.1; // Mild noise
    const absLatitude = Math.abs(latitude);
    const temperature = Math.min(
        0.9 * Math.exp(-Math.pow(absLatitude - 0.3, 2) / 0.1) + temperatureNoiseValue,
        1
    );

    // Calculate humidity based on latitude and noise
    const humidityNoiseValue = humidityNoise(rowIndex * climateScale, colIndex * climateScale) * 0.1; // Mild noise
    const humidity = Math.min(
        (1 - absLatitude) * 0.9 + humidityNoiseValue,
        1
    );

    const terrain = determineTerrain(altitude, temperature, humidity);

    // Calculate distance to nearest water
    const distanceToWater = findNearestWaterDistance(rowIndex, colIndex);

    // Calculate habitability
    const habitability = calculateHabitability(altitude, temperature, humidity, distanceToWater, 0);

    return { 
        altitude, 
        temperature, 
        humidity, 
        vegetation: 0, 
        terrain, 
        latitude, 
        plate: closestPlate,
        features: [],
        habitability // Add habitability to the tile
    };
}

// Find the closest plate center to a tile
export function findClosestPlate(
    x: number,
    y: number,
    centers: Array<{ x: number; y: number }>,
    width: number
): number {
    let minDistance = Infinity;
    let closestPlates: number[] = [];

    centers.forEach((center, index) => {
        const dx = Math.abs(center.x - x); // No wrapping
        const dy = Math.abs(center.y - y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestPlates = [index];
        } else if (distance === minDistance) {
            closestPlates.push(index);
        }
    });

    return closestPlates[Math.floor(Math.random() * closestPlates.length)];
}

export function identifyPlateBoundaries(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; plate: number; features: string[] }>>,
    height: number,
    width: number,
    plateCenters: Array<{ x: number; y: number; drift: { dx: number; dy: number } }>
): Array<{ row: number; col: number; type: 'convergent' | 'divergent' | 'transform' }> {
    const boundaries: Array<{ row: number; col: number; type: 'convergent' | 'divergent' | 'transform' }> = [];

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const tile = map[row][col];
            const neighbors = getHexNeighbors(map, row, col, height, width);

            for (const neighbor of neighbors) {
                const neighborTile = map[neighbor.row][neighbor.col];

                if (tile.plate !== neighborTile.plate) {
                    const currentPlate = plateCenters[tile.plate];
                    const neighborPlate = plateCenters[neighborTile.plate];

                    // Calculate relative drift direction
                    const relativeDriftX = neighborPlate.drift.dx - currentPlate.drift.dx;
                    const relativeDriftY = neighborPlate.drift.dy - currentPlate.drift.dy;

                    // Determine boundary type based on relative drift
                    let type: 'convergent' | 'divergent' | 'transform';
                    if (relativeDriftX * (neighbor.col - col) + relativeDriftY * (neighbor.row - row) > 0) {
                        type = 'divergent';
                    } else if (relativeDriftX * (neighbor.col - col) + relativeDriftY * (neighbor.row - row) < 0) {
                        type = 'convergent';
                    } else {
                        type = 'transform';
                    }

                    boundaries.push({ row, col, type });
                }
            }
        }
    }

    return boundaries;
}

export function assignPlatesUsingVoronoi(
    width: number,
    height: number,
    plates: number
): Array<Array<number>> {
    const plateCenters = Array.from({ length: plates }, () => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
    }));

    const plateMap = Array.from({ length: height }, () =>
        Array(width).fill(-1)
    );

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            let closestPlate = -1;
            let minDistance = Infinity;

            for (let i = 0; i < plateCenters.length; i++) {
                const center = plateCenters[i];
                const dx = Math.abs(center.x - col); // No wrapping
                const dy = Math.abs(center.y - row);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlate = i;
                }
            }

            plateMap[row][col] = closestPlate;
        }
    }

    return plateMap;
}

export function calculatePlateSizes(
    plateMap: Array<Array<number>>,
    plates: number
): Array<number> {
    const plateSizes = Array(plates).fill(0);

    for (let row = 0; row < plateMap.length; row++) {
        for (let col = 0; col < plateMap[row].length; col++) {
            const plateId = plateMap[row][col];
            if (plateId >= 0) {
                plateSizes[plateId]++;
            }
        }
    }

    return plateSizes;
}

export function calculateHabitability(
    altitude: number,
    temperature: number,
    humidity: number,
    distanceToWater: number | null,
    vegetation: number // Add vegetation as a factor
): number {
    // Altitude factor: More habitable at moderate altitudes
    const altitudeFactor = Math.max(0, 1 - Math.abs(altitude - 0.3));

    // Temperature factor: More habitable at moderate temperatures
    const temperatureFactor = Math.max(0, 1 - Math.abs(temperature - 0.5));

    // Humidity factor: More habitable with moderate to high humidity
    const humidityFactor = humidity;

    // Water proximity factor: More habitable closer to water
    const waterFactor = distanceToWater !== null ? Math.max(0, 1 - distanceToWater * 0.1) : 0;

    // Vegetation factor: More habitable with moderate vegetation
    const vegetationFactor = Math.max(0, 1 - Math.abs(vegetation - 0.5));

    // Combine factors to calculate habitability
    const habitability = 
        (altitudeFactor * 0.3) + 
        (temperatureFactor * 0.25) + 
        (humidityFactor * 0.2) + 
        (waterFactor * 0.1) + 
        (vegetationFactor * 0.15);

    return Math.min(1, Math.max(0, habitability)); // Clamp to [0, 1]
}