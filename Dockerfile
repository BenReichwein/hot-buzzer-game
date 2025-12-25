# Use Node 22 as base
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of npm ci to avoid lockfile strict mode
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port (Railway assigns PORT automatically)
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
