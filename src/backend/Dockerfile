# --- 1. Builder Stage ---
# This stage installs dependencies and builds the app
FROM	node:20-slim AS builder
WORKDIR	/app

# Install build dependencies for 'better-sqlite3': Python, Make, and C++ compiler (g++)
RUN		apt-get update && \
		apt-get install -y --no-install-recommends \
		python3 \
		g++ \
		make \
		&& rm -rf /var/lib/apt/lists/*

# Set a build-time argument for the Node environment
ARG		NODE_ENV=production
ENV		NODE_ENV=${NODE_ENV}

# Copy package files and install production dependencies
COPY	package.json package-lock.json ./
RUN		npm ci --production --build-from-source

# Copy the rest of the source code
COPY	. .

# Run the 'build' command (tsc)
RUN		npm run build

# --- 2. Production Stage ---
# This stage copies *only* what's needed to run the app
FROM	node:20-slim AS production
WORKDIR	/app

# Set the production environment
ARG		NODE_ENV=production
ENV		NODE_ENV=${NODE_ENV}

# Copy built code from the builder stage
COPY	--from=builder /app/dist ./dist

# Copy production node_modules from the builder stage
COPY	--from=builder /app/node_modules ./node_modules

# Copy package.json (needed to run 'npm start')
COPY	package.json .

# Copy the database (this is the initial state)
# Use a volume in docker-compose to make this data persist
COPY	db ./db

# Expose the internal port
EXPOSE	3000

# The command to run the server
CMD		[ "npm", "run", "start" ]
