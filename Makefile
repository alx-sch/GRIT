NAME :=				grit

BACKUP_FOLDER :=	backups
BACKEND_FOLDER :=	apps/backend
FRONTEND_FOLDER :=	apps/frontend

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

RESET :=		\033[0m
BOLD :=			\033[1m
GREEN :=		\033[32m
YELLOW :=		\033[33m
BLUE :=			\033[34m
RED :=			\033[91m

# ---------------------------------------------------
# TARGETS
# ---------------------------------------------------

all:	start

#########################
## 🛠️ UTILITY COMMANDS ##
#########################

# Installs all dependencies
install:
	@echo "$(BOLD)$(YELLOW)--- Installing  Dependencies...$(RESET)"
	@pnpm install --reporter=silent
	@echo "$(BOLD)$(GREEN)Dependencies installed.$(RESET)"

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean: stop-dev
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	pnpm -r exec rm -rf dist .vite .turbo node_modules
	rm -rf node_modules
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# WIP: WILL EVENTUALLY HANDLE POSTGRES
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting All Databases...$(RESET)"
	@echo "$(GREEN)$(BOLD)All databases deleted.$(RESET)"

# Removes the local backup folder
clean-backup:
	@echo "$(BOLD)$(RED)--- Deleting Backup Folder...$(RESET)"
	rm -rf $(BACKUP_FOLDER)
	@echo "$(GREEN)$(BOLD)Backup folder deleted.$(RESET)"

typecheck: install
	@echo "$(BOLD)$(YELLOW)--- Typechecking...$(RESET)"
	pnpm run -r typecheck;
	@echo "$(BOLD)$(GREEN)Typecheck complete.$(RESET)"

lint: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	pnpm run lint;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

format: install
	@echo "$(BOLD)$(YELLOW)--- Formating...$(RESET)"
	pnpm run format;
	@echo "$(BOLD)$(GREEN)Formating complete.$(RESET)"

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

dev: stop-dev
	@echo "$(BOLD)$(YELLOW)--- Starting Backend & Frontend [DEV]...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run dev;

# Forcibly stops all dev server processes
stop-dev:
	@echo "$(BOLD)$(YELLOW)--- Stopping Workspace Processes...$(RESET)"
	-@pkill -f "pnpm" 2>/dev/null || true
	-@pkill -f "vite" 2>/dev/null || true
	@echo "$(BOLD)$(GREEN)Workspace processes stopped.$(RESET)"

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
			echo "$(RED)Volume '$$vol' does not exist.$(RESET)"; \
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
			echo "$(RED)Volume '$$vol' does not exist.$(RESET)"; \
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
			echo "$(RED)Volume '$$vol' does not exist.$(RESET)"; \
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
			echo "$(RED)Backup for volume '$$vol' does not exist.$(RESET)"; \
		fi; \
	done

############################
## 📦 PRODUCTION COMMANDS ##
############################

build: install
	@echo "$(BOLD)$(YELLOW)--- Building Backend & Fronted...$(RESET)"
	pnpm -r --parallel run build
	@echo "$(BOLD)$(GREEN)Backend & Frontend build complete.$(RESET)"

run: stop-dev build
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	pnpm -r --parallel run start

## run-be / run-fe can envetually be removed once there is a backend ('build' craches otherwise)
run-be: build
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build...$(RESET)"
	pnpm --filter @grit/backend start

run-fe: build
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Preview...$(RESET)"
	pnpm --filter @grit/frontend start

###############################

# Starts production services via Docker Compose
start:
	@echo "$(BOLD)$(YELLOW)--- Starting Production Services via Docker Compose...$(RESET)"
	$(DC) up -d --build
	@echo "$(BOLD)$(GREEN)Production services started in detached mode.$(RESET)"
	@echo ""
	@echo "•   View live logs:"
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
		install \
		clean clean-db clean-backup \
		typecheck \
		purge \
		dev stop-dev \
		vol-ls vol-inspect vol-backup vol-restore \
		build build-be build-fe \
		run run-be run-fe \
		start stop
