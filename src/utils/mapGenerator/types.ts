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
};

export type Map = Tile[][];