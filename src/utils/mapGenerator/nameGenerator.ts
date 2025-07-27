import seedrandom from 'seedrandom';

// Try to import existing name files based on what actually exists
let regionNames: any = {};
let plateNames: string[] = [];
let naturalFeatureNames: any = {};
let manmadeFeatureNames: any = {};

// Load existing name files
try {
    regionNames = require('../names/regions.json');
} catch (e) { regionNames = {}; }

try {
    plateNames = require('../names/plates.json')['tectonic-plates'] || [];
} catch (e) { plateNames = []; }

try {
    naturalFeatureNames = require('../names/naturalFeatures.json');
} catch (e) { naturalFeatureNames = {}; }

try {
    manmadeFeatureNames = require('../names/manmadeFeatures.json');
} catch (e) { manmadeFeatureNames = {}; }

class NameGenerator {
    private rng: () => number;
    private usedNames: Set<string> = new Set();
    private nameCounters: Record<string, number> = {};

    constructor(seed: string) {
        // Use the same seed as other functions
        this.rng = seedrandom(seed);
    }

    // Generate a name by combining prefix and suffix
    private combineWords(prefixes: string[], suffixes: string[]): string {
        if (!prefixes || !suffixes || prefixes.length === 0 || suffixes.length === 0) {
            return '';
        }

        const prefix = prefixes[Math.floor(this.rng() * prefixes.length)];
        const suffix = suffixes[Math.floor(this.rng() * suffixes.length)];
        
        return `${prefix}${suffix}`;
    }

    // Get a random name from a specific category
    getName(category: string, fallbackPrefix: string = 'Unnamed'): string {
        let name: string = '';

        // Handle different naming strategies based on category
        switch (category) {
            case 'lake':
                if (naturalFeatureNames.lakes?.prefixes && naturalFeatureNames.lakes?.suffixes) {
                    name = this.combineWords(naturalFeatureNames.lakes.prefixes, naturalFeatureNames.lakes.suffixes);
                    name = `Lake ${name.charAt(0).toUpperCase() + name.slice(1)}`;
                }
                break;

            case 'river':
                if (naturalFeatureNames.rivers?.prefixes && naturalFeatureNames.rivers?.suffixes) {
                    name = this.combineWords(naturalFeatureNames.rivers.prefixes, naturalFeatureNames.rivers.suffixes);
                    name = `River ${name.charAt(0).toUpperCase() + name.slice(1)}`;
                }
                break;

            case 'volcano':
                if (naturalFeatureNames.volcanoes?.prefixes && naturalFeatureNames.volcanoes?.suffixes) {
                    name = this.combineWords(naturalFeatureNames.volcanoes.prefixes, naturalFeatureNames.volcanoes.suffixes);
                    name = `Mount ${name.charAt(0).toUpperCase() + name.slice(1)}`;
                }
                break;

            case 'city':
                if (manmadeFeatureNames.cities?.prefixes && manmadeFeatureNames.cities?.suffixes) {
                    name = this.combineWords(manmadeFeatureNames.cities.prefixes, manmadeFeatureNames.cities.suffixes);
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'town':
                if (manmadeFeatureNames.towns?.prefixes && manmadeFeatureNames.towns?.suffixes) {
                    name = this.combineWords(manmadeFeatureNames.towns.prefixes, manmadeFeatureNames.towns.suffixes);
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'village':
                if (manmadeFeatureNames.villages?.prefixes && manmadeFeatureNames.villages?.suffixes) {
                    name = this.combineWords(manmadeFeatureNames.villages.prefixes, manmadeFeatureNames.villages.suffixes);
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'continent':
                if (regionNames.Continents?.prefixes && regionNames.Continents?.suffixes) {
                    name = this.combineWords(regionNames.Continents.prefixes, regionNames.Continents.suffixes);
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'island':
                if (regionNames.Islands?.prefixes && regionNames.Islands?.suffixes) {
                    name = this.combineWords(regionNames.Islands.prefixes, regionNames.Islands.suffixes);
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'archipelago':
                if (regionNames.Archipelagos?.prefixes && regionNames.Archipelagos?.suffixes) {
                    const prefix = regionNames.Archipelagos.prefixes[Math.floor(this.rng() * regionNames.Archipelagos.prefixes.length)];
                    const suffix = regionNames.Archipelagos.suffixes[Math.floor(this.rng() * regionNames.Archipelagos.suffixes.length)];
                    name = `${prefix} ${suffix}`;
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'ocean':
                if (regionNames.Oceans?.prefixes && regionNames.Oceans?.suffixes) {
                    const prefix = regionNames.Oceans.prefixes[Math.floor(this.rng() * regionNames.Oceans.prefixes.length)];
                    const suffix = regionNames.Oceans.suffixes[Math.floor(this.rng() * regionNames.Oceans.suffixes.length)];
                    name = `${prefix} ${suffix}`;
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'sea':
                if (regionNames.Seas?.prefixes && regionNames.Seas?.suffixes) {
                    const prefix = regionNames.Seas.prefixes[Math.floor(this.rng() * regionNames.Seas.prefixes.length)];
                    const suffix = regionNames.Seas.suffixes[Math.floor(this.rng() * regionNames.Seas.suffixes.length)];
                    name = `${prefix} ${suffix}`;
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'bay':
                if (regionNames.Bays?.prefixes && regionNames.Bays?.suffixes) {
                    const prefix = regionNames.Bays.prefixes[Math.floor(this.rng() * regionNames.Bays.prefixes.length)];
                    const suffix = regionNames.Bays.suffixes[Math.floor(this.rng() * regionNames.Bays.suffixes.length)];
                    name = `${prefix} ${suffix}`;
                    name = name.charAt(0).toUpperCase() + name.slice(1);
                }
                break;

            case 'plate':
                if (plateNames && plateNames.length > 0) {
                    name = plateNames[Math.floor(this.rng() * plateNames.length)];
                }
                break;

            default:
                name = '';
                break;
        }

        // Fallback to numbered names if no name was generated
        if (!name) {
            this.nameCounters[category] = (this.nameCounters[category] || 0) + 1;
            return `${fallbackPrefix} ${this.nameCounters[category]}`;
        }

        // Handle duplicate names
        if (this.usedNames.has(name)) {
            let counter = 2;
            let numberedName = `${name} ${counter}`;
            while (this.usedNames.has(numberedName)) {
                counter++;
                numberedName = `${name} ${counter}`;
            }
            name = numberedName;
        }

        this.usedNames.add(name);
        return name;
    }

    // Get a name for a geographic region
    getRegionName(type: string): string {
        switch (type) {
            case 'continent':
                return this.getName('continent', 'Continent');
            case 'island':
                return this.getName('island', 'Island');
            case 'archipelago':
                return this.getName('archipelago', 'Archipelago');
            case 'ocean':
                return this.getName('ocean', 'Ocean');
            case 'sea':
                return this.getName('sea', 'Sea');
            case 'bay':
                return this.getName('bay', 'Bay');
            default:
                return this.getName(type, 'Region');
        }
    }

    // Get a name for coastal waters based on parent land region
    getCoastalWatersName(parentLandRegionName: string): string {
        // For combined word system, just add "Waters" to the parent name
        return `${parentLandRegionName} Waters`;
    }

    // Get a name for a tectonic plate
    getPlateName(): string {
        return this.getName('plate', 'Plate');
    }

    // Get a name for a settlement (each type has its own table)
    getSettlementName(type: string): string {
        switch (type) {
            case 'city':
                return this.getName('city', 'City');
            case 'town':
                return this.getName('town', 'Town');
            case 'village':
                return this.getName('village', 'Village');
            default:
                return this.getName(type, type.charAt(0).toUpperCase() + type.slice(1));
        }
    }

    // Get a name for a geographic feature
    getFeatureName(type: string): string {
        switch (type) {
            case 'lake':
                return this.getName('lake', 'Lake');
            case 'river':
                return this.getName('river', 'River');
            case 'volcano':
                return this.getName('volcano', 'Mount');
            default:
                return this.getName(type, type.charAt(0).toUpperCase() + type.slice(1));
        }
    }

    // Reset used names (useful for testing)
    reset(): void {
        this.usedNames.clear();
        this.nameCounters = {};
    }
}

export { NameGenerator };