export type Tile = {
    altitude: number;
    plate: number;
    features: string[];
    terrain: string;
    temperature: number;
    humidity: number;
    vegetation: number;
    latitude: number;
    habitability: number;
    climateZone: string;
    regionId?: number;
    regionType?: 'continent' | 'island' | 'archipelago' | 'ocean' | 'sea' | 'coastal-waters' | 'bay';
};

export type Map = Tile[][];