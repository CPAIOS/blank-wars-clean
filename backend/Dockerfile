# Backend Dockerfile for deployment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create data directory for SQLite (if needed)
RUN mkdir -p data

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]