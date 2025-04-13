export function generateRivers(
    map: Array<Array<{ altitude: number; humidity: number; hasRiver: boolean }>>,
    riverCount: number
): Array<{ start: [number, number]; end: [number, number] }> {
    const height = map.length;
    const width = map[0].length;
    const riverPaths: Array<{ start: [number, number]; end: [number, number] }> = [];

    for (let i = 0; i < riverCount; i++) {
        let row = Math.floor(Math.random() * height);
        let col = Math.floor(Math.random() * width);

        // Ensure the starting point is above altitude 0
        while (map[row][col].altitude <= 0) {
            row = Math.floor(Math.random() * height);
            col = Math.floor(Math.random() * width);
        }

        let previousTile = { row, col };

        while (map[row][col].altitude > 0) { // Stop if the river reaches altitude 0
            map[row][col].hasRiver = true; // Mark the tile as having a river
            map[row][col].humidity += Math.random() * 0.3; // Increase humidity in the river tile

            // Find the lowest neighboring tile
            const neighbors = [
                { row: row - 1, col },
                { row: row + 1, col },
                { row, col: col - 1 },
                { row, col: col + 1 },
            ].filter(
                ({ row: r, col: c }) =>
                    r >= 0 && r < height && c >= 0 && c < width
            );

            const nextTile = neighbors.reduce((lowest, current) => {
                if (
                    map[current.row][current.col].altitude <
                    map[lowest.row][lowest.col].altitude
                ) {
                    return current;
                }
                return lowest;
            }, { row, col });

            if (
                nextTile.row === row &&
                nextTile.col === col
            ) {
                break; // Stop if no lower neighbor
            }

            // Add the river segment to the path
            riverPaths.push({
                start: [previousTile.row, previousTile.col],
                end: [nextTile.row, nextTile.col],
            });

            previousTile = { row, col };
            row = nextTile.row;
            col = nextTile.col;
        }
    }

    return riverPaths;
}