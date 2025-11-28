NAME :=				ft_transcendence

SRC_FOLDER :=		src
BACKEND_FOLDER :=	$(SRC_FOLDER)/backend
FRONTEND_FOLDER :=	$(SRC_FOLDER)/frontend
BACKUP_FOLDER :=	backups

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
BE_RUN_CMD :=		$(foreach s,$(BE_APPS),"npm run start -w $(s)")

# ---------------------------------------------------
# DOCKER COMPOSE / DEPLOYMENT
# ---------------------------------------------------

DEPL_PATH :=			deployment
ENV_FILE :=				${DEPL_PATH}/.env
DOCKER_COMP_FILE :=		${DEPL_PATH}/docker-compose.yaml

# Docker Compose command shortcut
DC = docker compose -f $(DOCKER_COMP_FILE) --env-file $(ENV_FILE) -p $(NAME)

# ---------------------------------------------------
# NAMED DOCKER VOLUMES
# ---------------------------------------------------

VOLUMES :=		caddy_data \
				caddy_config

PREF_VOLUMES :=	$(foreach v,$(VOLUMES),$(NAME)_$(v))

# ---------------------------------------------------
# FORMATTING CONSTANTS
# ---------------------------------------------------

RESET :=			\033[0m
BOLD :=				\033[1m
GREEN :=			\033[32m
YELLOW :=			\033[33m
BLUE :=				\033[34m
RED :=				\033[91m

# ---------------------------------------------------
# TARGETS
# ---------------------------------------------------

all:	start

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
		DB_DIR="${BACKEND_FOLDER}/$$service/storage"; \
		if [ -d $$DB_DIR ]; then \
			echo "Deleting databases in '$$service'..."; \
			rm -rf $$DB_DIR; \
		else \
			echo "No DB directory found for '$$service'"; \
		fi \
	done
	@echo "$(GREEN)$(BOLD)All databases deleted.$(RESET)"

# Removes the local backup folder
clean-backup:
	@echo "$(BOLD)$(RED)--- Deleting Backup Folder...$(RESET)"
	rm -rf $(BACKUP_FOLDER)
	@echo "$(GREEN)$(BOLD)Backup folder deleted.$(RESET)"

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
purge:	clean clean-db clean-backup
	@echo "$(BOLD)$(RED)SYSTEM-WIDE PURGE: Removing All Docker Resources...$(RESET)"
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	$(DC) down --volumes --rmi all
	@docker system prune -af --volumes
	@docker system df
	@echo "$(BOLD)$(GREEN)All Docker resources have been purged.$(RESET)"

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
		--prefix-colors "$(BE_COLORS_ARG)" \
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

###############################
## 🔍 DOCKER VOLUME COMMANDS ##
###############################

# Due to rootless system, it's tricky using mounted volumes or named volumes with local paths,
# as permission issues may arise. These commands help manage named volumes managed by Docker.

vol-ls:
	@echo "$(BOLD)$(YELLOW)--- Listing Docker Volumes...$(RESET)"
	@for vol in $(PREF_VOLUMES); do \
		if docker volume inspect $$vol >/dev/null 2>&1; then \
			echo "$(YELLOW)$(BOLD)Contents of $$vol: $(RESET)"; \
			docker run --rm -v $$vol:/data alpine ls -R /data 2>/dev/null; \
			echo ""; \
		else \
			echo "$(RED)Volume '$$vol' does not exist!$(RESET)"; \
		fi; \
	done

vol-inspect:
	@echo "$(BOLD)$(YELLOW)--- Inspecting Docker Volumes...$(RESET)"
	@for vol in $(PREF_VOLUMES); do \
		if docker volume inspect $$vol >/dev/null 2>&1; then \
			echo "$(YELLOW)$(BOLD)Inspecting $$vol: $(RESET)"; \
			docker volume inspect $$vol; \
			echo ""; \
		else \
			echo "$(RED)Volume '$$vol' does not exist!$(RESET)"; \
		fi; \
	done

vol-backup:
	@echo "$(BOLD)$(YELLOW)--- Backing Up Docker Volumes...$(RESET)"
	@for vol in $(PREF_VOLUMES); do \
		if docker volume inspect $$vol >/dev/null 2>&1; then \
			mkdir -p $(BACKUP_FOLDER); \
			echo "Backing up '$$vol' to '$(BACKUP_FOLDER)/$$vol.tar.gz'"; \
			docker run --rm -v $$vol:/data -v $$(pwd)/$(BACKUP_FOLDER):/backup alpine sh -c "cd /data && tar czf /backup/$$vol.tar.gz ."; \
		else \
			echo "$(RED)Volume '$$vol' does not exist!$(RESET)"; \
		fi; \
	done

# Restores volumes from local backups, overwriting existing data
vol-restore:
	@echo "$(BOLD)$(YELLOW)--- Restoring Docker Volumes from Backups...$(RESET)"
	@for vol in $(PREF_VOLUMES); do \
		if [ -f "$(BACKUP_FOLDER)/$$vol.tar.gz" ]; then \
			echo "Restoring '$$vol' from '$(BACKUP_FOLDER)/$$vol.tar.gz'"; \
			docker run --rm -v $$vol:/data -v $$(pwd)/$(BACKUP_FOLDER):/backup alpine sh -c "cd /data && tar xzf /backup/$$vol.tar.gz"; \
		else \
			echo "$(RED)Backup for volume '$$vol' does not exist!$(RESET)"; \
		fi; \
	done

############################
## 📦 PRODUCTION COMMANDS ##
############################

# 'build-be' + 'build-fe' are used for building locally;
# build step otherwise handled by Docker in deployment
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

###############################

# Run / start the production-ready builds (for testing purposes)

run:
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	@echo "Run '$(YELLOW)make run-be$(RESET)' in one terminal (backend)."
	@echo "Run '$(YELLOW)make run-fe$(RESET)' in a separate terminal (frontend)."

run-be:
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build ($(BLUE)http://localhost:3000$(RESET)$(BOLD)$(YELLOW))...-$(RESET)"
	@if [  ! -d "${BACKEND_FOLDER}/node_modules/" -o ! -d "${BACKEND_FOLDER}/user-service/dist" ]; then \
		echo "Build missing — building backend microservices..."; \
		$(MAKE) -s build-be; \
	fi
	cd ${BACKEND_FOLDER} && npx concurrently \
		--names $(shell echo $(BE_APPS) | tr ' ' ',') \
		--prefix-colors $(shell echo $(BE_APPS_CLR) | tr ' ' ',') \
		$(BE_RUN_CMD)

run-fe:
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Build ($(BLUE)http://localhost:5173$(RESET)$(BOLD)$(YELLOW))...$(RESET)"
	@if [ ! -f "${FRONTEND_FOLDER}/node_modules/.bin/vite" -o ! -d "${FRONTEND_FOLDER}/dist" ]; then \
		echo "Build missing — building frontend..."; \
		$(MAKE) -s build-fe; \
	fi
	cd ${FRONTEND_FOLDER} && npm run preview

###############################

# Starts production services via Docker Compose
start:
	@ if [ ! -d "${FRONTEND_FOLDER}/dist" ]; then \
		echo "$(BOLD)$(YELLOW)--- Frontend build not found...$(RESET)"; \
		$(MAKE) -s build-fe; \
	fi

	@echo "$(BOLD)$(YELLOW)--- Starting Production Services via Docker Compose...$(RESET)"
	$(DC) up -d --build
	@echo "$(BOLD)$(GREEN)Production services started in detached mode.$(RESET)"
	@echo ""
	@echo "•   View logs:"
	@echo "    '$(YELLOW)$(DC) logs -f$(RESET)'"
	@echo "•   Open the application:"
	@echo "    '$(YELLOW)https://localhost:8443$(RESET)'"
	@echo "     or '$(YELLOW)http://localhost:8080$(RESET)' (redirects to HTTPS)"

# Stops production services via Docker Compose
stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping production services...$(RESET)"
	$(DC) down
	@echo "$(BOLD)$(GREEN)Production services stopped.$(RESET)"

######################
## 📌 PHONY TARGETS ##
######################

.PHONY:	all \
		install install-be install-fe \
		clean clean-db clean-backup \
		typecheck typecheck-be typecheck-fe \
		purge \
		dev dev-be dev-fe dev-stop \
		vol-ls vol-inspect vol-backup vol-restore \
		build build-be build-fe \
		run run-be run-fe \
		start stop
