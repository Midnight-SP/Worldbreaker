import { determineTerrain } from './terrain';

// Generate a single tile
export function generateTile(
    rowIndex: number,
    colIndex: number,
    totalRows: number,
    latitudeMode: 'full' | 'partial'
): { 
    altitude: number; 
    temperature: number; 
    humidity: number; 
    vegetation: number; 
    terrain: string; 
    latitude: number; 
    plate: number; 
    features: string[];
} {
    const altitude = Math.random() * 2 - 0.95;

    // Adjust latitude based on the selected mode
    const baseLatitude = latitudeMode === 'full'
        ? 1 - (rowIndex / (totalRows - 0.5)) * 2 // Original mode: 1 to -1
        : 1 - (rowIndex / totalRows); // New mode: 1 to 0

    const latitudeOffset = (colIndex % 2 === 1) ? (1 / totalRows) : 0; // Offset for even/odd columns
    const latitude = baseLatitude - latitudeOffset;

    // Adjust temperature and humidity based on latitude
    const absLatitude = Math.abs(latitude);
    const temperature = Math.min(
        0.9 * Math.exp(-Math.pow(absLatitude - 0.3, 2) / 0.1) + 0.2 * Math.random() - 0.1 * Math.random(),
        1
    );
    const humidity = Math.min((1 - absLatitude) * Math.random() * 0.9 + Math.random() * 0.3, 1);

    const terrain = determineTerrain(altitude, temperature, humidity);

    return { 
        altitude, 
        temperature, 
        humidity, 
        vegetation: 0, 
        terrain, 
        latitude, 
        plate: -1,
        features: [] 
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