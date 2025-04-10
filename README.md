# React Hex Map

This project is a React application that generates a procedurally generated world map on a hexagonal grid. The application allows users to visualize and interact with a hexagonal grid representing different terrains and resources.

## Features

- Procedurally generated world map
- Hexagonal grid representation
- Interactive grid with potential for user interactions

## Getting Started

To get a local copy up and running, follow these steps:

### Prerequisites

- Node.js (version 14 or later)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Midnight-SP/Worldbreaker.git
   ```

2. Navigate to the project directory:
   ```
   cd worldbreaker
   ```

3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application

If you encounter an error related to `ERR_OSSL_EVP_UNSUPPORTED`, set the `NODE_OPTIONS` environment variable before starting the application:

#### On Windows (Command Prompt):
```
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

#### On macOS/Linux:
```
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

This will start the development server and open the application in your default web browser at `http://localhost:3000`.

## Usage

Once the application is running, you will see a hexagonal grid representing the procedurally generated world map. You can interact with the grid to explore different terrains and resources.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.