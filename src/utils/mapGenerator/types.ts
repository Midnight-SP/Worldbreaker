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

    regionName?: string;
    plateName?: string;
    cityName?: string;
    townName?: string;
    villageName?: string;
    lakeName?: string;
    riverName?: string;
    sourceName?: string;
    volcanoName?: string;
};

export type Map = Tile[][];