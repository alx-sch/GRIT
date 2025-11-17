NAME :=				ft_transcendence

DOCKER_COMP_F :=	srcs/docker-compose.yml
ENV_F :=			srcs/.env

# Base docker-compose command
DC = docker compose -f $(DOCKER_COMP_F) --env-file $(ENV_F)

# Formatting
RESET =				\033[0m
BOLD =				\033[1m
GREEN =				\033[32m
YELLOW =			\033[33m
RED :=				\033[91m

########### 
## RULES ##
###########

all: build up

build:
	@echo "$(BOLD)$(GREEN)🐳 Building Docker images...$(RESET)"
	@$(DC) build

up:
	@echo "$(BOLD)$(GREEN)🐳 Starting services...$(RESET)"
	@$(DC) -p $(NAME) up -d
	@echo "$(BOLD)$(GREEN)\n✅ Project $(YELLOW)$(NAME)$(GREEN) is now running...$(RESET)"
	@echo "$(YELLOW)\nUsage: Access the website here: $(BOLD)https://localhost$(RESET)"

clean:
	@echo "$(BOLD)$(RED)🐳 Stopping services and removing containers...$(RESET)"
	@$(DC) -p $(NAME) down
	@echo "$(BOLD)$(RED)🗑️  All Docker containers and networks have been removed.$(RESET)"

fclean:
	@echo "$(BOLD)$(RED)💥 FULL CLEANUP: Removing images and volumes...$(RESET)"
	@$(DC) -p $(NAME) down --rmi all --volumes
	@docker system prune -af --volumes
	@echo "$(BOLD)$(RED)🗑️  All Docker ressources have been removed.$(RESET)"

stop:
	@echo "$(BOLD)$(RED)Stopping all services... $(RESET)"
	@$(DC) -p $(NAME) stop

start:
	@echo "$(BOLD)$(GREEN)Starting all services... $(RESET)"
	@$(DC) -p $(NAME) start

status:
	@echo "$(BOLD)$(YELLOW)Current status of all services: $(RESET)"
	@$(DC) -p $(NAME) ps

re: fclean all

# Make sure all rules are listed here
.PHONY: all build up clean fclean stop start status re
