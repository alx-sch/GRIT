NAME :=				ft_transcendence

# If env file exists, include (into Makefile) and export (into shell) variables
DEPL_PATH :=		deployment
ENV_FILE :=			${DEPL_PATH}/.env
DOCKER_COMP_FILE :=	${DEPL_PATH}/docker-compose.prod.yaml

ifneq ($(wildcard $(ENV_FILE)),)
	include $(ENV_FILE)
	export $(shell sed 's/=.*//' $(ENV_FILE) | xargs)
endif

# Formatting
RESET =				\033[0m
BOLD =				\033[1m
GREEN =				\033[32m
YELLOW =			\033[33m
RED :=				\033[91m

# Base docker-compose command
DC = docker compose -f $(DOCKER_COMP_FILE) --env-file $(ENV_FILE)

#########################
## 🛠️ UTILITY COMMANDS ##
#########################

# Installs all dependencies for frontend and backend
install:
	@echo "$(BOLD)$(YELLOW)--- Installing backend dependencies... ---$(RESET)"
	cd ${BACKEND_FOLDER} && npm install
	@echo "$(BOLD)$(YELLOW)\n--- Installing frontend dependencies... ---$(RESET)"
	cd ${FRONTEND_FOLDER} && npm install

# Cleans the entire project (removes node_modules and build artifacts)
clean:	dev-stop
	@echo "$(BOLD)$(YELLOW)--- Cleaning up project... ---$(RESET)"
	rm -rf ${BACKEND_FOLDER}/node_modules
	rm -rf ${BACKEND_FOLDER}/dist
	rm -rf ${FRONTEND_FOLDER}/node_modules
	rm -rf ${SRC_FOLDER}/dist

# Stop all running containers and remove all Docker resources system-wide
purge:
	@echo "$(BOLD)$(RED)☢️  SYSTEM-WIDE PURGE: Stopping ALL running Docker containers...$(RESET)"
	@docker stop $$(docker ps -aq) || true
	@echo "$(BOLD)$(RED)🔥 Removing ALL unused Docker resources (containers, ALL images, volumes, cache)...$(RESET)"
	@docker system prune -af -a --volumes
	@rm -rf $(VOLUME_FOLDER)
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
	@if [ ! -f "${BACKEND_FOLDER}/node_modules/.bin/ts-node" ]; then \
		echo "$(BOLD)$(RED)Error: 'ts-node' not found.$(RESET)"; \
		echo "Please run '$(YELLOW)make install$(RESET)' first."; \
		exit 1; \
	fi
	cd ${BACKEND_FOLDER} && npm run dev

# Starts the frontend Vite server
dev-fe:
	@echo "$(BOLD)--- Starting Frontend [dev] ($(YELLOW)http://localhost:5173$(RESET)$(BOLD)) ---$(RESET)"
	@if [ ! -f "${FRONTEND_FOLDER}/node_modules/.bin/vite" ]; then \
		echo "$(BOLD)$(RED)Error: 'vite' not found.$(RESET)"; \
		echo "Please run '$(YELLOW)make install$(RESET)' first."; \
		exit 1; \
	fi
	cd ${FRONTEND_FOLDER} && npm run dev

# Forcibly stops all dev server processes
dev-stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping all dev processes... ---$(RESET)"
	pkill -f "[t]s-node [s]erver.ts" || true
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
