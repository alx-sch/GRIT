NAME :=				ft_transcendence

SRC_FOLDER :=		src
BACKEND_FOLDER :=	$(SRC_FOLDER)/backend
FRONTEND_FOLDER :=	$(SRC_FOLDER)/frontend

# ---------------------------------------------------
# LIST BACKEND SERVICES
# ---------------------------------------------------

BE_APPS :=			user-service

# Logging in different colors for each backend service (using NPM 'concurrently')
BE_APPS_CLR :=		bgBlue.bold

# ---------------------------------------------------
# VARIABLE GENERATION
# ---------------------------------------------------

BE_NAMES_ARG :=		$(shell echo $(BE_APPS) | tr ' ' ',')
BE_COLORS_ARG :=	$(shell echo $(BE_APPS_CLR) | tr ' ' ',')

BE_DEV_CMD :=		$(foreach s,$(BE_APPS),"npm run dev -w $(s)")
BE_PROD_CMD :=		$(foreach s,$(BE_APPS),"npm run start -w $(s)")

# Docker Compose
# DEPL_PATH :=		deployment
# ENV_FILE :=			${DEPL_PATH}/.env
# DOCKER_COMP_FILE :=	${DEPL_PATH}/docker-compose.prod.yaml

# DC = docker compose -f $(DOCKER_COMP_FILE) --env-file $(ENV_FILE)

# Formatting
RESET :=			\033[0m
BOLD :=				\033[1m
GREEN :=			\033[32m
YELLOW :=			\033[33m
BLUE :=				\033[34m
RED :=				\033[91m

#########################
## 🛠️ UTILITY COMMANDS ##
#########################

# Installs all dependencies for frontend and backend
install:	install-be install-fe

install-be:
	@echo "$(BOLD)$(YELLOW)--- Installing Backend Dependencies...$(RESET)"
	cd ${BACKEND_FOLDER} && npm install
	@echo "$(BOLD)$(GREEN)Backend dependencies installed.$(RESET)"

install-fe:
	@echo "$(BOLD)$(YELLOW)--- Installing Frontend Dependencies...$(RESET)"
	cd ${FRONTEND_FOLDER} && npm install
	@echo "$(BOLD)$(GREEN)Frontend dependencies installed.$(RESET)"

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean:	dev-stop
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	rm -rf ${BACKEND_FOLDER}/node_modules || true
	rm -rf ${BACKEND_FOLDER}/dist || true
	rm -rf ${FRONTEND_FOLDER}/node_modules || true
	rm -rf ${FRONTEND_FOLDER}/dist || true
	@for service in $(BE_APPS); do \
		echo "Cleaning '$$service'..."; \
		rm -rf ${BACKEND_FOLDER}/$$service/node_modules 2>/dev/null || true; \
		rm -rf ${BACKEND_FOLDER}/$$service/dist 2>/dev/null || true; \
		rm -rf ${BACKEND_FOLDER}/$$service/*.tsbuildinfo 2>/dev/null || true; \
	done
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# Remove all SQLite databases for all backend services
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting All Databases...$(RESET)"
	@for service in $(BE_APPS); do \
		DB_DIR="${BACKEND_FOLDER}/$$service/db"; \
		if [ -d $$DB_DIR ]; then \
			echo "Deleting databases in '$$service'..."; \
			rm -f $$DB_DIR/*.sqlite $$DB_DIR/*.sqlite-wal $$DB_DIR/*.sqlite-shm; \
		else \
			echo "No DB directory found for '$$service'"; \
		fi \
	done
	@echo "$(GREEN)$(BOLD)All databases deleted.$(RESET)"

typecheck:	typecheck-be typecheck-fe

typecheck-be:
	@echo "$(BOLD)$(YELLOW)--- Typechecking Backend...$(RESET)"
	@if [ ! -d "${BACKEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing backend packages..."; \
		$(MAKE) -s install-be;\
	fi
	@for service in $(BE_APPS); do \
		echo "typechecking '$$service'..."; \
		(cd ${BACKEND_FOLDER}/$$service && npm run typecheck) || exit 1; \
	done
	@echo "$(BOLD)$(GREEN)Backend typecheck complete.$(RESET)"

typecheck-fe:
	@echo "$(BOLD)$(YELLOW)--- Typechecking Frontend...$(RESET)"
	@if [ ! -d "${FRONTEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing frontend packages..."; \
		$(MAKE) -s install-fe;\
	fi
	(cd ${FRONTEND_FOLDER} && npm run typecheck) || exit 1;
	@echo "$(BOLD)$(GREEN)Frontend typecheck complete.$(RESET)"

# 'clean' + 'clean-db' + stops all running containers and remove all Docker resources system-wide
# Uses a temp container to delete persistent volume data (to avoid permission issues on rootless hosts)
purge:	clean clean-db
	@echo "$(BOLD)$(RED)☢️  SYSTEM-WIDE PURGE: Stopping All Running Docker Containers...$(RESET)"
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	
	@echo "$(BOLD)$(RED)💥 Deleting persistent volumes...$(RESET)"
	@docker run --rm -v $$(pwd):/clean -w /clean alpine rm -rf $(VOLUME_FOLDER)
	
	@echo "$(BOLD)$(RED)🔥 Removing all unused Docker resources (containers, images, volumes)...$(RESET)"
	@docker system prune -af --volumes
	@docker system df
	@echo "$(BOLD)$(GREEN)🗑️  All Docker resources have been purged.$(RESET)"

#############################
## 🚀 DEVELOPMENT COMMANDS ##
#############################

# Main 'dev' command. Requires two separate terminals.
dev:
	@echo "$(BOLD)$(YELLOW)--- Starting Development Mode...$(RESET)"
	@echo "Run '$(YELLOW)make dev-be$(RESET)' in one terminal (backend)."
	@echo "Run '$(YELLOW)make dev-fe$(RESET)' in a separate terminal (frontend)."

# Starts the backend API server
dev-be:
	@echo "$(BOLD)$(YELLOW)--- Starting Backend [DEV] ($(BLUE)http://localhost:3000$(RESET)$(BOLD)$(YELLOW))...$(RESET)"
	@if [ ! -d "${BACKEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing backend packages..."; \
		$(MAKE) -s install-be;\
	fi
	@cd $(BACKEND_FOLDER) && npx concurrently \
		--names "$(BE_NAMES_ARG)" \
		--prefix-colors "$(BE_APPS_CLR)" \
		$(BE_DEV_CMD)

# Starts the frontend Vite server
dev-fe:
	@echo "$(BOLD)$(YELLOW)--- Starting Frontend [DEV] ($(BLUE)http://localhost:5173$(RESET)$(BOLD)$(YELLOW))...$(RESET)"
	@if [ ! -d "${FRONTEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing frontend packages..."; \
		$(MAKE) -s install-fe;\
	fi
	cd ${FRONTEND_FOLDER} && npm run dev

# Forcibly stops all dev server processes
dev-stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping All DEV Processes...$(RESET)"
	pkill -f "[s]erver.ts" || true
	pkill -f "[v]ite" || true
	sleep 1
	@echo "$(BOLD)$(GREEN)All DEV processes stopped.$(RESET)"

############################
## 📦 PRODUCTION COMMANDS ##
############################

# 1. Builds both apps for production, checks for required tools
build:	build-be build-fe

build-be:
	@echo "$(BOLD)$(YELLOW)--- Building Backend...$(RESET)"
	@if [ ! -d "${BACKEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing backend packages..."; \
		$(MAKE) -s install-be; \
	fi
	@cd $(BACKEND_FOLDER) && npm run build
	@echo "$(BOLD)$(GREEN)Backend build complete.$(RESET)"

build-fe:
	@echo "$(BOLD)$(YELLOW)--- Building Frontend...$(RESET)"
	@if [ ! -d "${FRONTEND_FOLDER}/node_modules/" ]; then \
		echo "Dependencies missing — installing frontend packages..."; \
		$(MAKE) -s install-fe;\
	fi
	cd ${FRONTEND_FOLDER} && npm run build
	@echo "$(BOLD)$(GREEN)Frontend build complete.$(RESET)"

# 2. Starts production services using Vite Preview
start:
	@echo "$(BOLD)$(YELLOW)--- Starting Prodcution Mode...$(RESET)"
	@echo "Run '$(YELLOW)make start-be$(RESET)' in one terminal (backend)."
	@echo "Run '$(YELLOW)make start-fe$(RESET)' in a separate terminal (frontend)."

start-be:
	@echo "$(BOLD)$(YELLOW)--- Starting Backend [PROD] ($(BLUE)http://localhost:3000$(RESET)$(BOLD)$(YELLOW))...-$(RESET)"
	@if [  ! -d "${BACKEND_FOLDER}/node_modules/" -o ! -d "${BACKEND_FOLDER}/user-service/dist" ]; then \
		echo "Build missing — building backend microservices..."; \
		$(MAKE) -s build-be; \
	fi
	cd ${BACKEND_FOLDER} && npx concurrently \
		--names $(shell echo $(BE_NAMES_ARG) | tr ' ' ',') \
		--prefix-colors $(shell echo $(BE_COLORS_ARG) | tr ' ' ',') \
		$(BE_PROD_CMD)

start-fe:
	@echo "$(BOLD)$(YELLOW)--- Starting Frontend [PROD] ($(BLUE)http://localhost:5173$(RESET)$(BOLD)$(YELLOW))...$(RESET)"
	@if [ ! -f "${FRONTEND_FOLDER}/node_modules/.bin/vite" -o ! -d "${FRONTEND_FOLDER}/dist" ]; then \
		echo "Build missing — building frontend..."; \
		$(MAKE) -s build-fe; \
	fi
	cd ${FRONTEND_FOLDER} && npm run preview

# 	@echo "$(BOLD)$(YELLOW)--- Starting production services via Docker Compose... ---$(RESET)"
# 	@echo "$(BOLD)$(YELLOW)📁 Creating host directories for volumes...$(RESET)"
# 	mkdir -p $(VOLUME_FOLDER)/${VOLUME_CADDY_DATA}
# 	mkdir -p $(VOLUME_FOLDER)/${VOLUME_CADDY_CONFIG}
# 	@echo "$(DC)"
# 	$(DC) up -d --build

# 3. Stops production services
# stop:
# 	@echo "$(BOLD)$(GREEN)--- Stopping production services... ---$(RESET)"
# 	$(DC) down

.PHONY:	install install-be install-fe \
		clean clean-db purge \
		dev dev-be dev-fe dev-stop \
		build build-be build-fe \
		start start-be start-fe
