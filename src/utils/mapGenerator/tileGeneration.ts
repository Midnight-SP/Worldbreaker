import { determineTerrain } from './terrain';

// Generate a single tile
export function generateTile(rowIndex: number, colIndex: number, totalRows: number): { altitude: number; temperature: number; humidity: number; vegetation: number; terrain: string; latitude: number; hasRiver: boolean } {
    const altitude = Math.random() * 1.6 - 0.75; // Base altitude between -0.2 and 0.2

    // Adjust latitude based on row and column
    const baseLatitude = 1 - (rowIndex / (totalRows - 0.5)) * 2; // Latitude from 1 (top) to -1 (bottom)
    const latitudeOffset = (colIndex % 2 === 1) ? (1 / totalRows) : 0; // Offset for even/odd columns
    let latitude = baseLatitude - latitudeOffset;

    // Adjust temperature based on latitude
    const absLatitude = Math.abs(latitude);
    const temperature = Math.min(
        0.9 * Math.exp(-Math.pow(absLatitude - 0.3, 2) / 0.1) + 0.2 * Math.random() - 0.1 * Math.random(),
        1
    ); // Peak near tropics (0.9), lower near poles (0) and equator (0.5)

    // Adjust humidity based on latitude
    const humidity = Math.min((1 - absLatitude) * Math.random() * 0.9 + Math.random() * 0.3, 1);

     //Adjust vegetation based on altitude
     const vegetation = Math.min((1 - altitude) * Math.random() * 0.9 + Math.random() * 0.3, 1); // Vegetation from 0 to 1 based on altitude

    const terrain = determineTerrain(altitude, temperature, humidity);
    return { altitude, temperature, humidity, vegetation, terrain, latitude, hasRiver: false };
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
        const dx = Math.min(Math.abs(center.x - x), width - Math.abs(center.x - x)); // Wrap horizontally
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