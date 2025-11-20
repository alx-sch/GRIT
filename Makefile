NAME :=				ft_transcendence

SRC_FOLDER :=		src
BACKEND_FOLDER :=	$(SRC_FOLDER)/backend
FRONTEND_FOLDER :=	$(SRC_FOLDER)/frontend

# Backend services
SERVICES_BE :=		user-service

SERVICES_BE_COL :=	blue

SERVICES_BE_CMD :=	$(foreach s,$(SERVICES_BE),"npm run dev --prefix $(s)")

# Frontend services
##

# Docker Compose
DEPL_PATH :=		deployment
ENV_FILE :=			${DEPL_PATH}/.env
DOCKER_COMP_FILE :=	${DEPL_PATH}/docker-compose.prod.yaml

DC = docker compose -f $(DOCKER_COMP_FILE) --env-file $(ENV_FILE)

# Formatting
RESET =				\033[0m
BOLD =				\033[1m
GREEN =				\033[32m
YELLOW =			\033[33m
RED :=				\033[91m

#########################
## 🛠️ UTILITY COMMANDS ##
#########################

# Installs all dependencies for frontend and backend
install:	install-be install-fe

install-be:
	@echo "$(BOLD)$(YELLOW)--- Installing backend dependencies... ---$(RESET)"
	@echo "$(YELLOW)Installing concurrently in backend root...$(RESET)"
	cd ${BACKEND_FOLDER} && npm install --no-save concurrently
	@for service in $(SERVICES_BE); do \
		echo "$(YELLOW)Installing $$service$(RESET)..."; \
		cd ${BACKEND_FOLDER}/$$service && npm install; \
	done

install-fe:
	@echo "$(BOLD)$(YELLOW)\n--- Installing frontend dependencies... ---$(RESET)"
	cd ${FRONTEND_FOLDER} && npm install

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean:	dev-stop
	@echo "$(BOLD)$(YELLOW)--- Cleaning up project... ---$(RESET)"
	rm -rf ${BACKEND_FOLDER}/node_modules
	rm -rf ${BACKEND_FOLDER}/dist
	rm -rf ${FRONTEND_FOLDER}/node_modules
	rm -rf ${SRC_FOLDER}/dist
	@for service in $(SERVICES_BE); do \
		echo "Cleaning $$service..."; \
		rm -rf ${BACKEND_FOLDER}/$$service/node_modules; \
		rm -rf ${BACKEND_FOLDER}/$$service/dist; \
	done
	@echo "$(GREEN)Project cleaned up.$(RESET)"

# Remove all SQLite databases for all backend services
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting all backend SQLite databases... ---$(RESET)"
	@for service in $(SERVICES_BE); do \
		DB_DIR="${BACKEND_FOLDER}/$$service/db"; \
		if [ -d $$DB_DIR ]; then \
			echo "Deleting databases in $$service..."; \
			rm -f $$DB_DIR/*.sqlite $$DB_DIR/*.sqlite-wal $$DB_DIR/*.sqlite-shm; \
		else \
			echo "No DB directory found for $$service"; \
		fi \
	done
	@echo "$(GREEN)All databases deleted.$(RESET)"


# Stop all running containers and remove all Docker resources system-wide
# Uses a temp container to delete persistent volume data (to avoid permission issues on rootless hosts)
purge:
	@echo "$(BOLD)$(RED)☢️  SYSTEM-WIDE PURGE: Stopping ALL running Docker containers...$(RESET)"
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	
	@echo "$(BOLD)$(RED)💥 Deleting persistent volumes...$(RESET)"
	@docker run --rm -v $$(pwd):/clean -w /clean alpine rm -rf $(VOLUME_FOLDER)
	
	@echo "$(BOLD)$(RED)🔥 Removing ALL unused Docker resources (containers, images, volumes)...$(RESET)"
	@docker system prune -af --volumes
	@docker system df
	@echo "$(BOLD)$(RED)🗑️  All Docker resources have been purged.$(RESET)"

#############################
## 🚀 DEVELOPMENT COMMANDS ##
#############################

# Main 'dev' command. Requires two separate terminals.
dev:
	@echo "$(BOLD)--- Starting Development Mode... ---$(RESET)"
	@echo "Run '$(YELLOW)make dev-be$(RESET)' in one terminal (backend)."
	@echo "Run '$(YELLOW)make dev-fe$(RESET)' in a separate terminal (frontend)."

# Starts the backend API server
dev-be:
	@echo "$(BOLD)--- Starting Backend [dev] ($(YELLOW)http://localhost:3000$(RESET)$(BOLD)) ---$(RESET)"
	@if [ ! -f "${BACKEND_FOLDER}/node_modules/.bin/concurrently" ]; then \
		echo "Dependencies missing — installing backend packages..."; \
		$(MAKE) -s install-be;\
	fi
	cd ${BACKEND_FOLDER} && npx concurrently \
	--names $(shell echo $(SERVICES_BE) | tr ' ' ',') \
	--prefix-colors $(shell echo $(SERVICES_BE_COL) | tr ' ' ',') \
	$(SERVICES_BE_CMD)

# Starts the frontend Vite server
dev-fe:
	@echo "$(BOLD)--- Starting Frontend [dev] ($(YELLOW)http://localhost:5173$(RESET)$(BOLD)) ---$(RESET)"
	@if [ ! -f "${FRONTEND_FOLDER}/node_modules/.bin/vite" ]; then \
		echo "Dependencies missing — installing frontend packages..."; \
		$(MAKE) -s install-fe;\
	fi
	cd ${FRONTEND_FOLDER} && npm run dev

# Forcibly stops all dev server processes
dev-stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping all dev processes... ---$(RESET)"
	pkill -f "[s]erver.ts" || true
	pkill -f "[v]ite" || true

############################
## 📦 PRODUCTION COMMANDS ##
############################

# 1. Builds both apps for production, checks for required tools
build:
	@echo "$(BOLD)$(YELLOW)--- Building backend for production... ---$(RESET)"
	@if [ ! -f "${BACKEND_FOLDER}/node_modules/.bin/ts-node" ]; then \
		echo "$(BOLD)$(RED)Error: 'ts-node' not found.$(RESET)"; \
		echo "Please run '$(YELLOW)make install$(RESET)' first."; \
		exit 1; \
	fi
	cd ${BACKEND_FOLDER} && npm run build
	@echo "$(BOLD)$(YELLOW)--- Building frontend for production... ---$(RESET)"
	@if [ ! -f "${FRONTEND_FOLDER}/node_modules/.bin/vite" ]; then \
		echo "$(BOLD)$(RED)Error: 'vite' not found.$(RESET)"; \
		echo "Please run '$(YELLOW)make install$(RESET)' first."; \
		exit 1; \
	fi
	cd ${FRONTEND_FOLDER} && npm run build

# 2. Starts production services using Docker Compose
start:
	@echo "$(BOLD)$(YELLOW)--- Starting production services via Docker Compose... ---$(RESET)"
	@echo "$(BOLD)$(YELLOW)📁 Creating host directories for volumes...$(RESET)"
	mkdir -p $(VOLUME_FOLDER)/${VOLUME_CADDY_DATA}
	mkdir -p $(VOLUME_FOLDER)/${VOLUME_CADDY_CONFIG}
	@echo "$(DC)"
	$(DC) up -d --build

# 3. Stops production services
stop:
	@echo "$(BOLD)$(GREEN)--- Stopping production services... ---$(RESET)"
	$(DC) down
