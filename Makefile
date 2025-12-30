NAME :=				grit

BACKUP_FOLDER :=	backups
BACKEND_FOLDER :=	apps/backend
FRONTEND_FOLDER :=	apps/frontend

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
# ENV FILE
# ---------------------------------------------------

ENV_FILE :=		.env
ENV_EXMPL :=	.env.example

# Load example first (defaults)
-include $(ENV_EXMPL)

# Load real env second, if it exists (overrides example)
-include $(ENV_FILE)

# Export all variables to shell commands
export

# ---------------------------------------------------
# DOCKER COMPOSE / DEPLOYMENT
# ---------------------------------------------------

DEPL_PATH :=			deployment
DOCKER_COMP_FILE :=		${DEPL_PATH}/docker-compose.yaml

# Docker Compose command shortcut
DC :=	docker compose -f $(DOCKER_COMP_FILE) -p $(NAME)

# ---------------------------------------------------
# NAMED DOCKER VOLUMES
# ---------------------------------------------------

VOLUMES :=		caddy_data \
				caddy_config

PREF_VOLUMES :=	$(foreach v,$(VOLUMES),$(NAME)_$(v))

# ---------------------------------------------------
# PURGE COMMAND, warning if not in a Codespace (dedicated project dev container)
# ---------------------------------------------------

ifeq ($(shell [ -n "$$CODESPACES" ] && echo 1),1)
	PURGE_WARN := @echo "$(BOLD)$(RED)SYSTEM-WIDE PURGE: Removing All Docker Resources...$(RESET)"
else
	PURGE_WARN := \
		echo "$(BOLD)$(RED)⚠️ WARNING: This will remove ALL Docker resources on this machine!$(RESET)"; \
		read -p "Are you sure you want to continue? [y/n] " confirm; \
		if [ "$$confirm" != "y" ]; then \
			echo "Purge cancelled."; \
			exit 1; \
		fi; \
		echo "$(BOLD)$(RED)SYSTEM-WIDE PURGE: Removing All Docker Resources...$(RESET)"
endif

# ---------------------------------------------------
# TARGETS
# ---------------------------------------------------

all:	start

#######################
## 🛡️ ENV VALIDATION ##
#######################

# Check for .env file
check-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		printf "❌ Missing $(BOLD)$(ENV_FILE)$(RESET) file!\n➜ Run '$(BLUE)$(BOLD)make init-env$(RESET)' to create it.\n"; \
		exit 1; \
	fi

# Init .env files if not present
init-env:
	@test -f $(ENV_FILE) || (cp $(ENV_EXMPL) $(ENV_FILE) \
		&& echo "✅ Created $(BOLD)$(ENV_FILE)$(RESET) file ➜ Please configure it before running the project.");

#########################
## 🛠️ UTILITY COMMANDS ##
#########################

# -- INSTALLATION TARGETS --

# Installs all dependencies
install: install-be install-fe
	@echo "$(BOLD)$(GREEN)All dependencies installed.$(RESET)"

# Installs only Backend dependencies (incl. Prisma)
install-be:
	@echo "$(BOLD)$(YELLOW)--- Installing Backend Dependencies...$(RESET)"
	@pnpm --filter @grit/backend install
	@pnpm --filter @grit/backend exec prisma generate
	@echo "$(BOLD)$(GREEN)Backend dependencies installed.$(RESET)"

# Installs only Frontend dependencies
install-fe:
	@echo "$(BOLD)$(YELLOW)--- Installing Frontend Dependencies...$(RESET)"
	@pnpm --filter @grit/frontend install
	@echo "$(BOLD)$(GREEN)Frontend dependencies installed.$(RESET)"

# -- CLEANUP TARGETS --

# Clear (ghost) processes on ports
kill-ports:
	@echo "$(BOLD)$(YELLOW)--- Clearing Ports: ${BE_PORT}, ${DB_PORT}, ${FE_PORT}...$(RESET)"
	@lsof -t -i:$${BE_PORT} | xargs -r kill -9 || true
	@lsof -t -i:$${DB_PORT} | xargs -r kill -9 || true
	@lsof -t -i:$${FE_PORT} | xargs -r kill -9 || true

# Forcibly stops all project-related processes (if not running in containers)
stop-proc:
	@echo "$(BOLD)$(YELLOW)--- Stopping Workspace Processes...$(RESET)"
	-@pkill -f "pnpm" 2>/dev/null || true
	-@pkill -f "vite" 2>/dev/null || true
	-@pkill -f "nest" 2>/dev/null || true
	@$(MAKE) kill-ports --no-print-directory
	@echo "$(BOLD)$(GREEN)Workspace processes stopped.$(RESET)"

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean: stop-proc
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	rm -rf $(BACKEND_FOLDER)/src/generated
	pnpm -r exec rm -rf dist .vite .turbo node_modules
	rm -rf node_modules
	find . -name "*.tsbuildinfo" -type f -delete
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# Removes the database container and its persistent data volume; resets DB
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting Database and Wiping Volumes...$(RESET)"
	$(DC) down db --volumes
	@echo "$(GREEN)$(BOLD)Database volume deleted.$(RESET)"

# Removes the local backup folder
clean-backup:
	@echo "$(BOLD)$(RED)--- Deleting Backup Folder...$(RESET)"
	rm -rf $(BACKUP_FOLDER)
	@echo "$(GREEN)$(BOLD)Backup folder deleted.$(RESET)"

# Cleans everything related to this project: builds, node_modules, DB container, volumes, backups:
fclean: clean clean-backup
	$(DC) down --volumes --rmi local
	@echo "$(GREEN)$(BOLD)Project fully cleaned.$(RESET)"

## WARNING ##
# Purge: One command to rule them all! Stops all running containers and remove all Docker resources system-wide
purge: clean clean-backup
	@$(PURGE_WARN)
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	$(DC) down --volumes --rmi all
	@docker system prune -af --volumes
	@docker system df
	@echo "$(BOLD)$(GREEN)All Docker resources have been purged.$(RESET)"

# -- MISC TARGETS --

typecheck: install
	@echo "$(BOLD)$(YELLOW)--- Typechecking...$(RESET)"
	pnpm run -r typecheck;
	@echo "$(BOLD)$(GREEN)Typecheck complete.$(RESET)"

lint: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@pnpm run lint;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

lint-fix: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@pnpm run lint:fix;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

format: install
	@echo "$(BOLD)$(YELLOW)--- Formating...$(RESET)"
	pnpm run format;
	@echo "$(BOLD)$(GREEN)Formating complete.$(RESET)"

# Shows live logs of Docker services running (in the background)
logs:
	$(DC) logs -f

#############################
## 🚀 DEVELOPMENT COMMANDS ##
#############################

dev: stop-proc install db
	@echo "$(BOLD)$(YELLOW)--- Starting Backend & Frontend [DEV]...$(RESET)"
	pnpm run dev;

# Run only Backend with DB check; NEST clears terminal before printing
dev-be: check-env stop-proc db
	@echo "$(BOLD)$(GREEN)--- Starting BACKEND (API) ---$(RESET)"
	pnpm --filter @grit/backend dev

# Run only Frontend
dev-fe: check-env stop-proc install-fe
	@echo "$(BOLD)$(GREEN)--- Starting FRONTEND (UI) ---$(RESET)"
	pnpm --filter @grit/frontend dev

#############################
## 📁 DATABASE (LOCAL DEV) ##
#############################

# Starts only the database Docker container for local development
db: install-be
	@echo "$(BOLD)$(YELLOW)--- Starting Postgres [DOCKER]...$(RESET)"
	$(DC) up -d db
	@echo "$(BOLD)$(YELLOW)--- Waiting for DB to wake up...$(RESET)"
	@sleep 3
	@pnpm --filter @grit/backend exec prisma db push
	@$(MAKE) seed-db --no-print-directory
	@echo "$(BOLD)$(GREEN)Database is ready, schema is synced and initial users are seeded.$(RESET)"
	@echo "•   View logs (db): '$(YELLOW)make logs$(RESET)'"
	@echo "•   View database:  '$(YELLOW)make view-db$(RESET)'"

# Populates the database with initial test data
seed-db:
	@echo "$(BOLD)$(YELLOW)--- Seeding Database...$(RESET)"
	@pnpm --filter @grit/backend exec prisma db seed

# Opens the Prisma Studio GUI for database management
view-db:
	@echo "$(BOLD)$(YELLOW)--- Opening Prisma Studio...$(RESET)"
	@cd $(BACKEND_FOLDER) && npx prisma studio

# Stops the database container
stop-db:
	@echo "$(BOLD)$(YELLOW)--- Stopping Database services...$(RESET)"
	$(DC) stop db

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
			echo "Volume $(BOLD)'$$vol'$(RESET) does not exist."; \
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
			echo "Volume $(BOLD)'$$vol'$(RESET) does not exist."; \
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
			echo "Volume $(BOLD)'$$vol'$(RESET) does not exist."; \
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

# -- BUILD TARGETS --

# Build everything
build: build-be build-fe
	@echo "$(BOLD)$(GREEN)Full project build complete.$(RESET)"

# Build only Backend
build-be: check-env install-be
	@echo "$(BOLD)$(YELLOW)--- Building Backend...$(RESET)"
	pnpm --filter @grit/backend run build
	@echo "$(BOLD)$(GREEN)Backend build complete.$(RESET)"

# Build only Frontend
build-fe: check-env install-fe
	@echo "$(BOLD)$(YELLOW)--- Building Frontend...$(RESET)"
	pnpm --filter @grit/frontend run build
	@echo "$(BOLD)$(GREEN)Frontend build complete.$(RESET)"

# -- RUN TARGETS (PROD MODE) --

run: stop-proc build
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	pnpm -r --parallel run start

# Runs only the compiled Backend (dist/main.js)
run-be: build-be
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build...$(RESET)"
	pnpm --filter @grit/backend start

# Runs only the Frontend preview (dist/index.html)
run-fe: build-fe
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Preview...$(RESET)"
	pnpm --filter @grit/frontend start

###############################

# Starts production services via Docker Compose
start: check-env
	@echo "$(BOLD)$(YELLOW)--- Starting Production Services via Docker Compose...$(RESET)"
	$(DC) up -d --build
	@echo "$(BOLD)$(GREEN)Production services started in detached mode.$(RESET)"
	@echo "•   View live logs: '$(YELLOW)make logs$(RESET)'"
	@echo "•   View app:       '$(YELLOW)https://localhost:$(HTTPS_PORT)$(RESET)' / '$(YELLOW)http://localhost:$(HTTP_PORT)$(RESET)'"

# Stops production services via Docker Compose
stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping production services...$(RESET)"
	$(DC) down
	@echo "$(BOLD)$(GREEN)Production services stopped.$(RESET)"

######################
## 📌 PHONY TARGETS ##
######################

.PHONY:	all \
		init-env install install-fe install-be check-env \
		clean clean-db clean-backup kill-ports stop-proc purge\
		typecheck lint lint-fix format logs \
		dev dev-be dev-fe \
		db seed-db view-db stop-db \
		vol-ls vol-inspect vol-backup vol-restore \
		build build-be build-fe run run-be run-fe \
		start stop
