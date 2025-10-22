FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
