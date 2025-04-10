export const biomes = [
    // Deep ocean and ocean biomes
    { name: 'abyss', altitude: -1, temperature: 0.4, humidity: 0.9 }, // Deepest ocean depths
    { name: 'deep-ocean', altitude: -0.8, temperature: 0.5, humidity: 0.8 },
    { name: 'ocean', altitude: -0.5, temperature: 0.5, humidity: 0.8 },
    { name: 'coral-reef', altitude: -0.3, temperature: 0.8, humidity: 0.9 },

    // Coastal and beach biomes
    { name: 'beach', altitude: 0, temperature: 0.7, humidity: 0.6 },
    { name: 'rocky-coast', altitude: 0, temperature: 0.6, humidity: 0.5 },

    // Hot and dry biomes
    { name: 'desert', altitude: 0.2, temperature: 1, humidity: 0.1 },
    { name: 'dunes', altitude: 0.3, temperature: 1, humidity: 0.05 }, // Sand dunes
    { name: 'mesa', altitude: 0.4, temperature: 0.9, humidity: 0.2 },

    // Grasslands and plains
    { name: 'plain', altitude: 0.3, temperature: 0.6, humidity: 0.4 },
    { name: 'savanna', altitude: 0.4, temperature: 0.8, humidity: 0.3 },
    { name: 'steppe', altitude: 0.4, temperature: 0.7, humidity: 0.3 },
    { name: 'prairie', altitude: 0.3, temperature: 0.6, humidity: 0.5 }, // Lush grasslands

    // Wet and tropical biomes
    { name: 'rainforest', altitude: 0.4, temperature: 0.9, humidity: 1 },
    { name: 'jungle', altitude: 0.5, temperature: 0.9, humidity: 0.9 },
    { name: 'mangrove', altitude: 0.2, temperature: 0.8, humidity: 1 },
    { name: 'swamp', altitude: 0.3, temperature: 0.6, humidity: 0.9 },
    { name: 'wetland', altitude: 0.3, temperature: 0.5, humidity: 0.8 },

    // Forests
    { name: 'forest', altitude: 0.5, temperature: 0.6, humidity: 0.7 },
    { name: 'redwood-forest', altitude: 0.6, temperature: 0.5, humidity: 0.6 },
    { name: 'savanna-forest', altitude: 0.4, temperature: 0.8, humidity: 0.5 },
    { name: 'temperate-forest', altitude: 0.5, temperature: 0.5, humidity: 0.6 }, // Cooler forest

    // Cold and dry biomes
    { name: 'taiga', altitude: 0.6, temperature: 0.3, humidity: 0.5 },
    { name: 'tundra', altitude: 0.8, temperature: 0.2, humidity: 0.3 },
    { name: 'glacier', altitude: 1, temperature: 0, humidity: 0.2 },
    { name: 'iceberg', altitude: -0.5, temperature: 0, humidity: 0.3 },

    // Mountainous biomes
    { name: 'mountain', altitude: 1, temperature: 0.4, humidity: 0.3 },
    { name: 'alpine', altitude: 1, temperature: 0.2, humidity: 0.4 },
    { name: 'rocky-mountain', altitude: 0.9, temperature: 0.3, humidity: 0.2 }, // Rocky terrain

    // Volcanic biomes
    { name: 'volcano', altitude: 1, temperature: 1, humidity: 0.2 },
    { name: 'lava-field', altitude: 0.8, temperature: 1, humidity: 0.1 }, // Near volcanic areas
];