NAME :=				grit

SRC_FOLDER :=		src
BACKUP_FOLDER :=	backups

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

# Installs all dependencies
install:
	@echo "$(BOLD)$(YELLOW)--- Installing  Dependencies...$(RESET)"
	pnpm install
	@echo "$(BOLD)$(GREEN)Dependencies installed.$(RESET)"

# Cleans all generated files (installed 'node_modules', 'dist' folders etc.)
clean:	dev-stop
	@echo "$(BOLD)$(YELLOW)--- Cleaning Up Project...$(RESET)"
	@rm -rf node_modules 2>/dev/null || true;
	@rm -rf dist* || true;
	@echo "$(BOLD)$(GREEN)Project cleaned up.$(RESET)"

# WIP: WILL EVENTUALLY HANDLE POSTGRES
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

typecheck:
	@echo "$(BOLD)$(YELLOW)--- Typechecking...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run typecheck;
	@echo "$(BOLD)$(GREEN)Backend typecheck complete.$(RESET)"

lint:
	@echo "$(BOLD)$(YELLOW)--- Linting...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run lint;
	@echo "$(BOLD)$(GREEN)Linting complete.$(RESET)"

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

dev:
	@echo "$(BOLD)$(YELLOW)--- Starting Backend & Frontend [DEV]...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run dev;

# Starts the backend API server
dev-be:
	@echo "$(BOLD)$(YELLOW)--- Starting Backend [DEV]...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run dev:be;

# Starts the frontend Vite server
dev-fe:
	@echo "$(BOLD)$(YELLOW)--- Starting Frontend [DEV]...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run dev:fe

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

# 'build-be' + 'build-fe' are used for building locally;
# build step otherwise handled by Docker in deployment
build:
	@echo "$(BOLD)$(YELLOW)--- Building Backend & Fronted...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run build
	@echo "$(BOLD)$(GREEN)Backend & Frontend build complete.$(RESET)"

build-be:
	@echo "$(BOLD)$(YELLOW)--- Building Backend...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run build:be
	@echo "$(BOLD)$(GREEN)Backend build complete.$(RESET)"

build-fe:
	@echo "$(BOLD)$(YELLOW)--- Building Frontend...$(RESET)"
	@if [ ! -d "node_modules/" ]; then \
		echo "Dependencies missing — installing frontend packages..."; \
		$(MAKE) -s install;\
	fi
	pnpm run build:fe
	@echo "$(BOLD)$(GREEN)Frontend build complete.$(RESET)"

###############################

# Run / start the production-ready builds, not in containers (for testing)

run:
	@echo "$(BOLD)$(YELLOW)--- Running Build...$(RESET)"
	@echo "Run '$(YELLOW)make run-be$(RESET)' in one terminal (backend)."
	@echo "Run '$(YELLOW)make run-fe$(RESET)' in a separate terminal (frontend)."

run-be:
	@echo "$(BOLD)$(YELLOW)--- Running Backend Build...$(RESET)"
	@if [ ! -d "node_modules" -o ! -d "dist-be" ]; then \
		echo "Build missing — building backend..."; \
		$(MAKE) -s build-be;\
	fi
	pnpm run start

run-fe:
	@echo "$(BOLD)$(YELLOW)--- Running Frontend Build...$(RESET)"
	@if [ ! -d "node_modules" -o ! -d "dist-fe" ]; then \
		echo "Build missing — building frontend..."; \
		$(MAKE) -s build-fe; \
	fi
	pnpm run preview

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
		install install-be install-fe \
		clean clean-db clean-backup \
		typecheck typecheck-be typecheck-fe \
		purge \
		dev dev-be dev-fe dev-stop \
		vol-ls vol-inspect vol-backup vol-restore \
		build build-be build-fe \
		run run-be run-fe \
		start stop
