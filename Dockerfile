# Stage 1: Build React PWA
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies (only for frontend)
COPY package*.json ./
RUN npm install

# Build frontend
COPY . .
ARG VITE_INTERNAL_PROXY_KEY
ENV VITE_INTERNAL_PROXY_KEY=$VITE_INTERNAL_PROXY_KEY
RUN npm run build

# Stage 2: Production Proxy & Static Server
FROM node:18-alpine

WORKDIR /app

# Switch to non-root user 'node' as recommended in the Playbook context
RUN chown -R node:node /app
USER node

ARG VITE_INTERNAL_PROXY_KEY
ENV VITE_INTERNAL_PROXY_KEY=$VITE_INTERNAL_PROXY_KEY
ENV INTERNAL_PROXY_KEY=$VITE_INTERNAL_PROXY_KEY

# We copy the bare minimum files for the proxy server
COPY --chown=node:node package*.json ./
# Make sure to install production dependencies only for the node server
RUN npm install --omit=dev

# Copy the server file
COPY --chown=node:node server.js ./

# Copy the static dist folder built in Stage 1
COPY --chown=node:node --from=build /app/dist ./dist

# Avoid running on privileged port
EXPOSE 8115

CMD ["node", "server.js"]
