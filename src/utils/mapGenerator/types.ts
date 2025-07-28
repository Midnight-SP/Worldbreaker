export type Tile = {
    altitude: number;
    temperature: number;
    humidity: number;
    vegetation: number;
    terrain: string;
    climateZone: string;
    latitude: number;
    plate: number;
    features: string[];
    habitability: number;
    regionId?: number;
    regionType?: 'continent' | 'island' | 'archipelago' | 'ocean' | 'sea' | 'coastal-waters' | 'bay';

    regionName?: string;
    plateName?: string;
    cityName?: string;
    townName?: string;
    villageName?: string;
    lakeName?: string;
    volcanoName?: string;
    sourceName?: string;
    riverName?: string;

    travelBonuses?: TravelBonuses;
    tradeRoutes?: TradeRoute[];
};

export interface TravelBonuses {
    landTravel: number;     // Bonus for land-based travel
    seaTravel: number;      // Bonus for sea-based travel  
    riverTravel: number;    // Bonus for river-based travel
    mountainTravel: number; // Bonus for high-altitude travel
}

export interface TradeRoute {
    from: { row: number; col: number };
    to: { row: number; col: number };
    distance: number;
    travelTime: number;
    routeType: 'land' | 'sea' | 'river' | 'mountain' | 'mixed';
    path: Array<{ row: number; col: number }>;
    tradeValue: number; // Economic value of the route
}

export type Map = Tile[][];