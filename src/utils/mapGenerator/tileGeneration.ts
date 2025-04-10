import { determineTerrain } from './terrain';

// Generate a single tile
export function generateTile(rowIndex: number, colIndex: number, totalRows: number): { altitude: number; temperature: number; humidity: number; terrain: string; latitude: number } {
    const altitude = Math.random() * 1.6 - 0.75; // Base altitude between -0.2 and 0.2

    // Adjust latitude based on row and column
    const baseLatitude = 1 - (rowIndex / (totalRows - 0.5)) * 2; // Latitude from 1 (top) to -1 (bottom)
    const latitudeOffset = (colIndex % 2 === 1) ? (1 / totalRows) : 0; // Offset for even/odd columns
    let latitude = baseLatitude - latitudeOffset;

    // Adjust temperature based on latitude
    const absLatitude = Math.abs(latitude);
    const temperature = Math.min(Math.exp(-Math.pow(absLatitude - 0.25, 2) / 0.05) * Math.random() * 0.8 + (1 - absLatitude) * Math.random() * 0.5 + Math.random() * 0.05, 1); // Peak at 0.2 latitude

    // Adjust humidity based on latitude
    const humidity = Math.min((1 - absLatitude) * Math.random() * 0.9 + Math.random() * 0.3, 1);

    const terrain = determineTerrain(altitude, temperature, humidity);
    return { altitude, temperature, humidity, terrain, latitude };
}

// Find the closest continent center to a tile
export function findClosestContinent(
    x: number,
    y: number,
    centers: Array<{ x: number; y: number }>,
    width: number
): number {
    let minDistance = Infinity;
    let closestContinents: number[] = [];

    centers.forEach((center, index) => {
        const dx = Math.min(Math.abs(center.x - x), width - Math.abs(center.x - x)); // Wrap horizontally
        const dy = Math.abs(center.y - y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closestContinents = [index];
        } else if (distance === minDistance) {
            closestContinents.push(index);
        }
    });

    // If multiple continents are equidistant, choose one randomly
    return closestContinents[Math.floor(Math.random() * closestContinents.length)];
}