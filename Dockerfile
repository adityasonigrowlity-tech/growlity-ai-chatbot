# --- Stage 1: Build the Frontend ---
FROM node:18-alpine AS build-frontend
WORKDIR /app/frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ .
RUN npm run build

# --- Stage 2: Final Unified Image ---
FROM node:18-alpine
WORKDIR /usr/src/app

# Install Backend dependencies
COPY Backend/package*.json ./
RUN npm install --production

# Copy Backend source
COPY Backend/ .

# Copy built Frontend to Backend's public folder
# This allows the Express server to serve the Chatbot app
COPY --from=build-frontend /app/frontend/dist ./public

# Expose the API/Frontend port
EXPOSE 5000

# Start the unified server
CMD [ "node", "server.js" ]
