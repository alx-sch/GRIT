NAME :=				grit

BACKEND_FOLDER :=	apps/backend
FRONTEND_FOLDER :=	apps/frontend

TIMESTAMP :=	$(shell date +%Y%m%d_%H%M%S)

PROJECT_ROOT :=	$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
export PATH :=	$(PROJECT_ROOT)/node_modules/.bin:$(PATH)

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

BACKUP_NAME :=	$(APP_NAME)_backups

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
				caddy_config \
				db_data \
				s3_data

PREF_VOLUMES :=	$(foreach v,$(VOLUMES),$(NAME)_$(v))

# ---------------------------------------------------
# PURGE COMMAND, warning if not in a Codespace (dedicated project dev container)
# ---------------------------------------------------

ifeq ($(shell [ -n "$$CODESPACES" ] && echo 1),1)
	PURGE_WARN := @echo "$(BOLD)$(RED)SYSTEM-WIDE PURGE: Removing All Docker Resources...$(RESET)"
else
	PURGE_WARN := \
		echo "$(BOLD)$(RED)⚠️  WARNING: This will remove ALL Docker resources on this machine!$(RESET)"; \
		read -p "Are you sure you want to continue? [y/N] " confirm; \
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

# Build shared schema packages
build-schema:
	@echo "$(BOLD)$(YELLOW)--- Building Shared Schema...$(RESET)"
	@pnpm install
	@pnpm --filter @grit/schema build
	@echo "$(BOLD)$(GREEN)Shared Schema build complete.$(RESET)"

# Installs all dependencies
install: install-be install-fe
	@echo "$(BOLD)$(GREEN)All dependencies installed.$(RESET)"

# Installs only Backend dependencies (incl. Prisma)
install-be: build-schema
	@echo "$(BOLD)$(YELLOW)--- Installing Backend Dependencies...$(RESET)"
	@pnpm --filter @grit/backend install
	@pnpm --filter @grit/backend exec prisma generate --no-hints
	@echo "$(BOLD)$(GREEN)Backend dependencies installed.$(RESET)"

# Installs only Frontend dependencies
install-fe: build-schema
	@echo "$(BOLD)$(YELLOW)--- Installing Frontend Dependencies...$(RESET)"
	@pnpm --filter @grit/frontend install
	@echo "$(BOLD)$(GREEN)Frontend dependencies installed.$(RESET)"

# -- CLEANUP TARGETS --

# Forcibly stops all project-related processes
stop-dev-processes:
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Dev Processes for $(PROJECT_ROOT)...$(RESET)"
	@pgrep -f '$(PROJECT_ROOT).*[n]ode.*([v]ite|[n]est|[e]sbuild|[p]npm)' | xargs kill -9 2>/dev/null || true
	@$(DC) down --remove-orphans
	@echo "$(BOLD)$(GREEN)Dev processes stopped.$(RESET)"

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean: stop-dev-processes
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	pnpm -r exec rm -rf dist .vite node_modules .turbo
	rm -rf node_modules .turbo
	find . -name "*.tsbuildinfo" -type f -delete
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# Removes the database container and its persistent data volume; resets DB
clean-db:
	@echo "$(BOLD)$(RED)--- Deleting Database and Wiping Volumes...$(RESET)"
	$(DC) down postgres-db --volumes
	@echo "$(GREEN)$(BOLD)Database volume deleted.$(RESET)"

# Removes the local backup folder
clean-backup:
	@echo "$(BOLD)$(RED)--- Deleting Backup Folder...$(RESET)"
	rm -rf $(BACKUP_NAME)*
	@echo "$(GREEN)$(BOLD)Backup folder deleted.$(RESET)"

# Helper to wipe Turbo's stale daemon files
clean-turbo:
	@echo "$(BOLD)$(YELLOW)--- Cleaning stale Turbo daemons ...$(RESET)"
	@rm -rf /tmp/turbod/

# Cleans everything related to this project: builds, node_modules, DB container, volumes, backups:
fclean: clean clean-backup
	$(DC) down --volumes --rmi local
	rm -f $(ENV_FILE)
	@echo "$(GREEN)$(BOLD)Project fully cleaned.$(RESET)"

kill-port-be:
	@PORT_PID=$$(lsof -t -i:$(BE_PORT)); \
	if [ ! -z "$$PORT_PID" ]; then \
		echo "$(BOLD)$(YELLOW)--- Port $(BE_PORT) is occupied (Backend Port)---$(RESET)"; \
		echo "$(BLUE)Process Details:$(RESET)"; \
		ps -p $$PORT_PID -o pid,user,start,etime,command | sed 's/^/  /'; \
		echo ""; \
		printf "⚠️  Kill this process? [y/N] " && read confirm < /dev/tty; \
		if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
			kill -9 $$PORT_PID; \
			echo "$(GREEN)Done. Process $$PORT_PID has been terminated.$(RESET)"; \
		else \
			echo "$(RED)Port $(BE_PORT) remains occupied.$(RESET)"; \
		fi; \
	else \
		echo "$(GREEN)Port $(BE_PORT) is clear.$(RESET)"; \
	fi

kill-port-fe:
	@PORT_PID=$$(lsof -t -i:$(FE_PORT)); \
	if [ ! -z "$$PORT_PID" ]; then \
		echo "$(BOLD)$(YELLOW)--- Port $(FE_PORT) is occupied (Frontend Port)---$(RESET)"; \
		echo "$(BLUE)Process Details:$(RESET)"; \
		ps -p $$PORT_PID -o pid,user,start,etime,command | sed 's/^/  /'; \
		echo ""; \
		printf "⚠️  Kill this process? [y/N] " && read confirm < /dev/tty; \
		if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
			kill -9 $$PORT_PID; \
			echo "$(GREEN)Done. Process $$PORT_PID has been terminated.$(RESET)"; \
		else \
			echo "$(RED)Port $(FE_PORT) remains occupied.$(RESET)"; \
		fi; \
	else \
		echo "$(GREEN)Port $(FE_PORT) is clear.$(RESET)"; \
	fi

## WARNING ##
# Purge: One command to rule them all! Stops all running containers and remove all Docker resources system-wide
purge: fclean
	@$(PURGE_WARN)
	@docker stop $$(docker ps -aq) 2>/dev/null || true
	$(DC) down --volumes --rmi all
	@docker system prune -af --volumes
	@docker system df
	@echo "$(BOLD)$(GREEN)All Docker resources have been purged.$(RESET)"

# -- MISC TARGETS --

typecheck: install
	@echo "$(BOLD)$(YELLOW)--- Typechecking...$(RESET)"
	@turbo typecheck --no-update-notifier;
	@echo "$(BOLD)$(GREEN)Typecheck complete.$(RESET)"

lint: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@rm -rf /tmp/turbod/*
	@turbo lint --no-update-notifier;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

lint-fix: install
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@turbo lint:fix --no-update-notifier;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

format: clean install
	@echo "$(BOLD)$(YELLOW)--- Formating...$(RESET)"
	pnpm run format;
	@echo "$(BOLD)$(GREEN)Formating complete.$(RESET)"

# Shows live logs of Docker services running (in the background)
logs:
	$(DC) logs -f

#######################
## 🔬 TEST COMMANDS  ##
#######################

# Run all Tests for backend and frontend
test: clean-turbo test-be test-fe

# Run all Tests for backend only
test-be:
	@echo "$(BOLD)$(YELLOW)--- Starting Backend Tests ...$(RESET)"
	@$(MAKE) --no-print-directory test-be-unit
# 	@$(MAKE) test-be-integration
	@$(MAKE) --no-print-directory test-be-e2e

# Separate commands for unit, integration and e2e test for faster and cheaper failing in CI
test-be-unit: install-be
	@echo "$(BOLD)$(YELLOW)--- Running Backend Unit Tests ...$(RESET)"
	@pnpm --filter @grit/backend exec prisma generate --no-hints
	@NODE_ENV=test turbo test:unit --filter=@grit/backend --no-update-notifier

test-be-integration: install-be test-be-testdb-init
	@echo "$(BOLD)$(YELLOW)--- Running Backend Integration Tests ...$(RESET)"
	@pnpm --filter @grit/backend exec prisma generate --no-hints
	@NODE_ENV=test turbo test:integration --filter=@grit/backend --no-update-notifier
	@$(MAKE) test-be-testdb-remove

test-be-e2e: install-be test-be-testdb-init
	@echo "$(BOLD)$(YELLOW)--- Running Backend E2E Tests ...$(RESET)"
	@pnpm --filter @grit/backend exec prisma generate --no-hints
	@NODE_ENV=test pnpm --filter @grit/backend test:e2e
	@$(MAKE) test-be-testdb-remove

# Helper commands
test-be-testdb-init: start-postgres
	@echo "$(BOLD)$(YELLOW)--- Creating Test Database ...$(RESET)"
	@$(DC) exec postgres-db psql -h localhost -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB)_test;"
	@$(DC) exec postgres-db psql -h localhost -U $(POSTGRES_USER) -d postgres -c "CREATE DATABASE $(POSTGRES_DB)_test;"
	@NODE_ENV=test pnpm --filter @grit/backend exec prisma db push

test-be-testdb-remove:
	@echo "$(BOLD)$(YELLOW)--- Removing Test Database ...$(RESET)"
	@$(DC) exec postgres-db psql -h localhost -U $(POSTGRES_USER) -d postgres -c "DROP DATABASE IF EXISTS $(POSTGRES_DB)_test;"

## Frontend ##

test-fe:
	@echo "$(BOLD)$(YELLOW)--- Starting Tests ...$(RESET)"
	@$(MAKE) --no-print-directory test-fe-integration
	#@$(MAKE) --no-print-directory test-fe-e2e

# Helper
test-fe-integration: install-fe
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Integration Tests ...$(RESET)"
	@NODE_ENV=test turbo test:integration --filter=@grit/frontend --no-update-notifier

#############################
## 🚀 DEVELOPMENT COMMANDS ##
#############################

dev: check-env stop-dev-processes kill-port-be kill-port-fe install db
	@echo "$(BOLD)$(YELLOW)--- Starting Backend & Frontend [DEV]...$(RESET)"
	@rm -rf /tmp/turbod/*
	@turbo dev --no-update-notifier 2>/dev/null

# Run only Backend with DB check; NEST clears terminal before printing
dev-be: check-env kill-port-be db
	@echo "$(BOLD)$(GREEN)--- Starting BACKEND (API) ---$(RESET)"
	@turbo --filter @grit/backend dev --no-update-notifier

# Run only Frontend
dev-fe: check-env kill-port-fe install-fe
	@echo "$(BOLD)$(GREEN)--- Starting FRONTEND (UI) ---$(RESET)"
	@turbo --filter @grit/frontend dev --no-update-notifier

###########################
## 📁 DATABASE & STORAGE ##
###########################

# Starts database AND MinIO for local development
db: start-postgres start-minio
	@pnpm --filter @grit/backend exec prisma db push
	@$(MAKE) seed-db --no-print-directory
	@echo "$(BOLD)$(GREEN)Database is ready, schema is synced and initial users are seeded.$(RESET)"
	@echo "•   View logs (db): '$(YELLOW)make logs$(RESET)'"
	@echo "•   View database:  '$(YELLOW)make view-db$(RESET)'"

# Helper: Starts the postgres container service
start-postgres: install-be
	@echo "$(BOLD)$(YELLOW)--- Starting Postgres [DOCKER]...$(RESET)"
	@$(DC) up -d postgres-db --no-build
	@echo "$(BOLD)$(YELLOW)--- Waiting for Postgres to wake up...$(RESET)"
	@RETRIES=10; \
	PG_CONTAINER=$$($(DC) ps -q postgres-db); \
	while [ $$RETRIES -gt 0 ]; do \
		if docker exec $$PG_CONTAINER pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) > /dev/null 2>&1; then \
			echo "$(GREEN)Postgres is ready!$(RESET)"; \
			break; \
		fi; \
		echo "Waiting for Postgres... ($$RETRIES attempts left)"; \
		RETRIES=$$((RETRIES - 1)); \
		sleep 1; \
	done; \
	if [ $$RETRIES -eq 0 ]; then \
		echo "$(RED)Timeout waiting for Postgres.$(RESET)"; \
		exit 1; \
	fi

# Helper: Starts the postgres container service
start-minio: install-be
	@echo "$(BOLD)$(YELLOW)--- Starting MinIO [DOCKER]...$(RESET)"
	@$(DC) up -d minio --no-build
	@echo "$(BOLD)$(YELLOW)--- Waiting for MinIO to wake up...$(RESET)"
	@RETRIES=10; \
	MINIO_CONTAINER=$$($(DC) ps -q minio); \
	while [ $$RETRIES -gt 0 ]; do \
		if docker logs $$MINIO_CONTAINER 2>&1 | grep -q "API:"; then \
			echo "$(GREEN)MinIO is ready!$(RESET)"; \
			break; \
		fi; \
		echo "Waiting for MinIO... ($$RETRIES attempts left)"; \
		RETRIES=$$((RETRIES - 1)); \
		sleep 1; \
	done; \
	if [ $$RETRIES -eq 0 ]; then \
		echo "$(RED)Timeout waiting for MinIO.$(RESET)"; \
		exit 1; \
	fi

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
			docker run --rm -v $$vol:/data alpine sh -c \
				"ls -R /data | awk 'NR <= 20 { print } END { if (NR > 20) print \"[...] \" }'" 2>/dev/null; \
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
	$(eval BACKUP_PATH := $(BACKUP_NAME)/$(BACKUP_NAME)_$(TIMESTAMP))
	@mkdir -p $(BACKUP_PATH)
	@for vol in $(PREF_VOLUMES); do \
		if docker volume inspect $$vol >/dev/null 2>&1; then \
			echo "Backing up '$$vol' to '$(BOLD)$(BACKUP_PATH)/$$vol.tar.gz$(RESET)'"; \
			docker run --rm \
				-v $$vol:/data \
				-v $$(pwd)/$(BACKUP_PATH):/backup \
				alpine sh -c "cd /data && tar czf /backup/$$vol.tar.gz ."; \
		else \
			echo "Volume $(BOLD)'$$vol'$(RESET) does not exist."; \
		fi; \
	done
	@echo "$(BOLD)$(GREEN)All volumes backed up to: $(BACKUP_PATH)$(RESET)"

# Restores volumes from local backups, overwriting existing data
# Uses the newest backup found
vol-restore:
	@echo "$(BOLD)$(YELLOW)--- Restoring Docker Volumes from Newest Backup...$(RESET)"
	$(eval LATEST_BACKUP := $(shell ls $(BACKUP_NAME) | tail -n 1))
	@if [ -z "$(LATEST_BACKUP)" ]; then \
		echo "$(RED)No backup folders found.$(RESET)"; \
		exit 1; \
	fi; \
	$(eval LATEST_BACKUP_FOLDER := $(BACKUP_NAME)/$(LATEST_BACKUP))
	@echo "$(BLUE)Found latest backup folder: $(BOLD)$(LATEST_BACKUP_FOLDER).$(RESET)"; \
	for vol in $(PREF_VOLUMES); do \
		BACKUP_FILE="$(LATEST_BACKUP_FOLDER)/$$vol.tar.gz"; \
		if [ -f "$$BACKUP_FILE" ]; then \
			printf "$(BLUE)Checking volume '$$vol'...$(RESET)\n"; \
			EXISTING_DATA=$$(docker run --rm -v $$vol:/data alpine sh -c "ls -A /data"); \
			if [ ! -z "$$EXISTING_DATA" ]; then \
				printf "$(RED)$(BOLD)⚠️  WARNING:$(RESET) Volume '$(YELLOW)$$vol$(RESET)' is NOT empty.\n"; \
				printf "Restoring will $(RED)DELETE ALL EXISTING DATA$(RESET) in this volume.\n"; \
				printf "Are you sure you want to proceed? [y/N] "; \
				read confirm < /dev/tty; \
				if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
					echo "Skipping $$vol..."; \
					continue; \
				fi; \
			fi; \
			echo "Restoring '$$vol' from '$$BACKUP_FILE'..."; \
			docker run --rm -v $$vol:/data -v $$(pwd)/$(LATEST_BACKUP_FOLDER):/backup alpine sh -c "rm -rf /data/* && cd /data && tar xzf /backup/$$vol.tar.gz"; \
			echo "$(GREEN)✅ $$vol restored successfully.$(RESET)"; \
		else \
			echo "$(RED)Backup file '$$BACKUP_FILE' does not exist in the latest backup folder.$(RESET)"; \
		fi; \
	done

############################
## 📦 PRODUCTION COMMANDS ##
############################

# -- BUILD TARGETS --

# Build everything
build: check-env install
	@echo "$(BOLD)$(YELLOW)--- Building Project (Turbo)...$(RESET)"
	turbo build
	@echo "$(BOLD)$(GREEN)Full project build complete.$(RESET)"

# Build only Backend
build-be: check-env install-be
	@echo "$(BOLD)$(YELLOW)--- Building Backend...$(RESET)"
	turbo build --filter=@grit/backend
	@echo "$(BOLD)$(GREEN)Backend build complete.$(RESET)"

# Build only Frontend
build-fe: check-env install-fe
	@echo "$(BOLD)$(YELLOW)--- Building Frontend...$(RESET)"
	turbo build --filter=@grit/frontend
	@echo "$(BOLD)$(GREEN)Frontend build complete.$(RESET)"

# -- RUN TARGETS (PROD MODE) --

run: stop-dev-processes kill-port-be kill-port-fe build db
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	pnpm -r --parallel run start

# Runs only the compiled Backend (dist/main.js)
run-be: kill-port-be build-be db
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build...$(RESET)"
	pnpm --filter @grit/backend start

# Runs only the Frontend preview (dist/index.html)
run-fe: kill-port-fe build-fe
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Preview...$(RESET)"
	pnpm --filter @grit/frontend start

###############################

# Starts production services via Docker Compose
start: check-env db
	@echo "$(BOLD)$(YELLOW)--- Launching Application Services...$(RESET)"
	$(DC) up -d --build backend caddy
	
	@echo "$(BOLD)$(GREEN)Full stack is live!$(RESET)"
	@echo "•   View live logs: '$(YELLOW)make logs$(RESET)'"
	
	@if [ -n "$(VITE_API_BASE_URL)" ]; then \
		echo "•   View app:       '$(YELLOW)$(subst /api,,$(VITE_API_BASE_URL))$(RESET)'"; \
	else \
		echo "•   View app:       '$(YELLOW)https://localhost:$(HTTPS_PORT)$(RESET)'"; \
	fi

# Stops production services via Docker Compose
stop:
	@echo "$(BOLD)$(YELLOW)--- Stopping production services...$(RESET)"
	$(DC) down
	@echo "$(BOLD)$(GREEN)Production services stopped.$(RESET)"

######################
## 📌 PHONY TARGETS ##
######################

.PHONY:	\
		all \
		build \
		build-be \
		build-fe \
		build-schema \
		check-env \
		clean \
		clean-backup \
		clean-db \
		clean-turbo \
		db \
		dev \
		dev-be \
		dev-fe \
		format \
		init-env \
		install \
		install-be \
		install-fe \
		lint \
		lint-fix \
		logs \
		purge \
		seed-db \
		start-postgres \
		start-minio \
		stop-db \
		stop-dev-processes \
		test-be \
		test-fe \
		typecheck \
		view-db \
		vol-backup \
		vol-inspect \
		vol-ls \
		vol-restore \
		run \
		run-be \
		run-fe \
		start \
		stop
