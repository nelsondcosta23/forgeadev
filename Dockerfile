# Stage 1: Build React PWA
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies (only for frontend)
COPY package*.json ./
RUN npm install

# Build frontend
COPY . .
RUN npm run build

# Stage 2: Production Proxy & Static Server
FROM node:22-alpine

WORKDIR /app

# Switch to non-root user 'node' as recommended in the Playbook context
RUN chown -R node:node /app
USER node

# We copy the bare minimum files for the proxy server
COPY --chown=node:node package*.json ./
# Make sure to install production dependencies only for the node server
RUN npm install --omit=dev

# Copy server and instrumentation files
COPY --chown=node:node server.js instrument.js ./

# Copy the static dist folder built in Stage 1
COPY --chown=node:node --from=build /app/dist ./dist

# Avoid running on privileged port
EXPOSE 3000

CMD ["node", "--import", "./instrument.js", "server.js"]
