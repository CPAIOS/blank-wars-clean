# Backend Dockerfile for deployment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Copy database directory (if needed)
COPY data ./data

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]