# 1. Base Image
FROM node:20-alpine AS builder

WORKDIR /app

# 2. Copy workspace package.json files
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# 3. Clean install all dependencies across workspaces
RUN npm ci

# 4. Copy shared and server code
COPY shared ./shared
COPY server ./server

# 5. Build Shared and Server logic
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# 6. Final Production Image
FROM node:20-alpine

WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app /app

# Expose the Colyseus Server Port
EXPOSE 2567

# Start the Node.js server
CMD ["npm", "run", "start", "--workspace=server"]
