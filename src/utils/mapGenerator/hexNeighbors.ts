export function getHexNeighbors(
    map: Array<Array<{ altitude: number; temperature: number; humidity: number; features: string[] }>>,
    row: number,
    col: number,
    height: number,
    width: number
): Array<{ row: number; col: number }> {
    const directions = col % 2 === 0
        ? [
            { dx: 0, dy: -1 }, // Top
            { dx: 1, dy: -1 }, // Top-right
            { dx: 1, dy: 0 },  // Bottom-right
            { dx: 0, dy: 1 },  // Bottom
            { dx: -1, dy: 0 }, // Bottom-left
            { dx: -1, dy: -1 } // Top-left
        ]
        : [
            { dx: 0, dy: -1 }, // Top
            { dx: 1, dy: 0 },  // Top-right
            { dx: 1, dy: 1 },  // Bottom-right
            { dx: 0, dy: 1 },  // Bottom
            { dx: -1, dy: 1 }, // Bottom-left
            { dx: -1, dy: 0 }  // Top-left
        ];

    const neighbors: Array<{ row: number; col: number }> = [];

    for (const { dx, dy } of directions) {
        const neighborRow = row + dy;
        const neighborCol = col + dx;

        // Ensure neighbors are within bounds
        if (neighborRow >= 0 && neighborRow < height && neighborCol >= 0 && neighborCol < width) {
            neighbors.push({ row: neighborRow, col: neighborCol });
        }
    }

    return neighbors;
}

export function getNumericHexNeighbors(
    map: Array<Array<number>>,
    row: number,
    col: number,
    height: number,
    width: number
): Array<{ row: number; col: number }> {
    const directions = col % 2 === 0
        ? [
            { dx: 0, dy: -1 }, // Top
            { dx: 1, dy: -1 }, // Top-right
            { dx: 1, dy: 0 },  // Bottom-right
            { dx: 0, dy: 1 },  // Bottom
            { dx: -1, dy: 0 }, // Bottom-left
            { dx: -1, dy: -1 } // Top-left
        ]
        : [
            { dx: 0, dy: -1 }, // Top
            { dx: 1, dy: 0 },  // Top-right
            { dx: 1, dy: 1 },  // Bottom-right
            { dx: 0, dy: 1 },  // Bottom
            { dx: -1, dy: 1 }, // Bottom-left
            { dx: -1, dy: 0 }  // Top-left
        ];

    const neighbors: Array<{ row: number; col: number }> = [];

    for (const { dx, dy } of directions) {
        const neighborRow = row + dy;
        const neighborCol = col + dx;

        if (neighborRow >= 0 && neighborRow < height) {
            neighbors.push({ row: neighborRow, col: neighborCol });
        }
    }

    return neighbors;
}