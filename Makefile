NAME :=				grit

BACKUP_FOLDER :=	backups
BACKEND_FOLDER :=	apps/backend
FRONTEND_FOLDER :=	apps/frontend

# ---------------------------------------------------
# DOCKER COMPOSE / DEPLOYMENT
# ---------------------------------------------------

DEPL_PATH :=			deployment
DOCKER_COMP_FILE :=		${DEPL_PATH}/docker-compose.yaml

ENV_FILE :=	.env
# sed 's/#.*//g;': Deletes anything after a # on any line (removes comments).
# /^[[:space:]]*$$/d: Deletes lines that are empty or only contain spaces.
# This ensures that xargs only sees only sees KEY=VALUE pairs.
LOAD_ENV := [ -f $(ENV_FILE) ] && export $$(sed 's/\#.*//g; /^[[:space:]]*$$/d' $(ENV_FILE) | xargs)

# Docker Compose command shortcut
DC = docker compose -f $(DOCKER_COMP_FILE) -p $(NAME)

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
## 🛡️ VALIDATION       ##
#########################

# List required variables here
REQUIRED_VARS :=	DATABASE_URL

check-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(BOLD)$(RED)❌ Error: $(ENV_FILE) is missing!$(RESET)"; \
		echo "Please create a .env file based on .env.example"; \
		exit 1; \
	fi
	@for var in $(REQUIRED_VARS); do \
		if ! grep -q "^$$var=" $(ENV_FILE) || [ -z "$$(grep "^$$var=" $(ENV_FILE) | cut -d'=' -f2-)" ]; then \
			echo "$(BOLD)$(RED)❌ Error: $$var is not set in $(ENV_FILE)$(RESET)"; \
			exit 1; \
		fi \
	done

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
	@$(LOAD_ENV); pnpm --filter @grit/backend exec prisma generate
	@echo "$(BOLD)$(GREEN)Backend dependencies installed.$(RESET)"

# Installs only Frontend dependencies
install-fe:
	@echo "$(BOLD)$(YELLOW)--- Installing Frontend Dependencies...$(RESET)"
	@pnpm --filter @grit/frontend install
	@echo "$(BOLD)$(GREEN)Frontend dependencies installed.$(RESET)"

# -- CLEANUP TARGETS --

# Clear (ghost) processes on backend (3000) and frontend (5173) ports
kill-ports:
	@echo "$(BOLD)$(YELLOW)--- Clearing Ghost Processes on Ports 3000 & 5173...$(RESET)"
	-@lsof -t -i:3000 | xargs -r kill -9 2>/dev/null || true
	-@lsof -t -i:5173 | xargs -r kill -9 2>/dev/null || true

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean: stop-dev
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	rm -rf $(BACKEND_FOLDER)/src/generated
	pnpm -r exec rm -rf dist .vite .turbo node_modules
	rm -rf node_modules
	find . -name "*.tsbuildinfo" -type f -delete
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# Removes the database container and its persistent data volume
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting Database and Wiping Volumes...$(RESET)"
	$(DC) down db --volumes
	@echo "$(GREEN)$(BOLD)Database volume deleted.$(RESET)"

# Removes the local backup folder
clean-backup:
	@echo "$(BOLD)$(RED)--- Deleting Backup Folder...$(RESET)"
	rm -rf $(BACKUP_FOLDER)
	@echo "$(GREEN)$(BOLD)Backup folder deleted.$(RESET)"

# Purge: One command to rule them all! Stops all running containers and remove all Docker resources system-wide
purge:	clean clean-backup
	@echo "$(BOLD)$(RED)SYSTEM-WIDE PURGE: Removing All Docker Resources...$(RESET)"
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
	@$(LOAD_ENV); pnpm run lint;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

lint-fix: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@$(LOAD_ENV); pnpm run lint:fix;
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

dev: stop-dev install db
	@echo "$(BOLD)$(YELLOW)--- Starting Backend & Frontend [DEV]...$(RESET)"
	pnpm run dev;

# Run only Backend with DB check; NEST clears terminal before printing
dev-be: check-env db
	@echo "$(BOLD)$(GREEN)--- Starting BACKEND (API) ---$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/backend dev

# Run only Frontend
dev-fe: check-env install-fe
	@echo "$(BOLD)$(GREEN)--- Starting FRONTEND (UI) ---$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/frontend dev

# Forcibly stops all dev server processes
stop-dev:
	@echo "$(BOLD)$(YELLOW)--- Stopping Workspace Processes...$(RESET)"
	-@pkill -f "pnpm" 2>/dev/null || true
	-@pkill -f "vite" 2>/dev/null || true
	-@pkill -f "nest" 2>/dev/null || true
	@$(MAKE) kill-ports --no-print-directory
	@echo "$(BOLD)$(GREEN)Workspace processes stopped.$(RESET)"

#############################
## 📁 DATABASE (LOCAL DEV) ##
#############################

# Starts only the database Docker container for local development
db: install-be
	@echo "$(BOLD)$(YELLOW)--- Starting Postgres [DOCKER]...$(RESET)"
	$(DC) up -d db
	@echo "$(BOLD)$(YELLOW)--- Waiting for DB to wake up...$(RESET)"
	@sleep 3
	@$(LOAD_ENV); pnpm --filter @grit/backend exec prisma db push
	@$(MAKE) seed-db --no-print-directory
	@echo "$(BOLD)$(GREEN)Database is ready, schema is synced and initial users are seeded.$(RESET)"
	@echo "•   View logs (db): '$(YELLOW)make logs$(RESET)'"
	@echo "•   View database:  '$(YELLOW)make view-db$(RESET)'"

# Populates the database with initial test data
seed-db:
	@echo "$(BOLD)$(YELLOW)--- Seeding Database...$(RESET)"
	@$(LOAD_ENV); pnpm --filter @grit/backend exec prisma db seed

# Opens the Prisma Studio GUI for database management
view-db:
	@echo "$(BOLD)$(YELLOW)--- Opening Prisma Studio...$(RESET)"
	@$(LOAD_ENV); cd $(BACKEND_FOLDER) && npx prisma studio

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

# -- BUILD TARGETS --

# Build everything
build: build-be build-fe
	@echo "$(BOLD)$(GREEN)Full project build complete.$(RESET)"

# Build only Backend
build-be: check-env install-be
	@echo "$(BOLD)$(YELLOW)--- Building Backend...$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/backend run build
	@echo "$(BOLD)$(GREEN)Backend build complete.$(RESET)"

# Build only Frontend
build-fe: check-env install-fe
	@echo "$(BOLD)$(YELLOW)--- Building Frontend...$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/frontend run build
	@echo "$(BOLD)$(GREEN)Frontend build complete.$(RESET)"

# -- RUN TARGETS (PROD MODE) --

run: stop-dev build
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	pnpm -r --parallel run start

# Runs only the compiled Backend (dist/main.js)
run-be: build-be
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build...$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/backend start

# Runs only the Frontend preview (dist/index.html)
run-fe: build-fe
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Preview...$(RESET)"
	$(LOAD_ENV); pnpm --filter @grit/frontend start

###############################

# Starts production services via Docker Compose
start: check-env
	@echo "$(BOLD)$(YELLOW)--- Starting Production Services via Docker Compose...$(RESET)"
	$(DC) up -d --build
	@echo "$(BOLD)$(GREEN)Production services started in detached mode.$(RESET)"
	@echo "•   View live logs: '$(YELLOW)make logs$(RESET)'"
	@echo "•   View app:       '$(YELLOW)https://localhost:8443$(RESET)' / '$(YELLOW)http://localhost:8080$(RESET)'"

# Stops production services via Docker Compose
stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping production services...$(RESET)"
	$(DC) down
	@echo "$(BOLD)$(GREEN)Production services stopped.$(RESET)"

######################
## 📌 PHONY TARGETS ##
######################

.PHONY:	all \
		install install-fe install-be check-env \
		clean clean-db clean-backup kill-ports purge\
		typecheck lint lint-fix format logs \
		dev dev-be dev-fe stop-dev \
		db seed-db view-db stop-db \
		vol-ls vol-inspect vol-backup vol-restore \
		build build-be build-fe run run-be run-fe \
		start stop
