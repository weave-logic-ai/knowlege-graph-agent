# Makefile for Weave-NN Docker Operations
# Convenience commands for common Docker workflows

.PHONY: help build up down logs test clean restart status shell

# Default target
help: ## Show this help message
	@echo "Weave-NN Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start services in development mode
	docker-compose up -d
	@echo "Services started. View logs with: make logs"

dev-build: ## Build and start services in development mode
	docker-compose up -d --build
	@echo "Services built and started. View logs with: make logs"

up: dev ## Alias for dev

build: ## Build all Docker images
	docker-compose build

down: ## Stop all services
	docker-compose down

stop: down ## Alias for down

logs: ## Follow logs for all services
	docker-compose logs -f

logs-api: ## Follow API service logs
	docker-compose logs -f api

logs-mcp: ## Follow MCP service logs
	docker-compose logs -f mcp-server

# Production commands
prod: ## Start services in production mode
	docker-compose -f docker-compose.yml --profile production up -d

prod-build: ## Build and start in production mode
	docker-compose -f docker-compose.yml --profile production up -d --build

# Service management
restart: ## Restart all services
	docker-compose restart

restart-api: ## Restart API service only
	docker-compose restart api

restart-mcp: ## Restart MCP service only
	docker-compose restart mcp-server

status: ## Show service status
	docker-compose ps

ps: status ## Alias for status

# Testing
test: ## Run tests
	docker-compose exec api pytest -v

test-cov: ## Run tests with coverage
	docker-compose exec api pytest --cov=src --cov-report=html --cov-report=term

lint: ## Run code linting
	docker-compose exec api flake8 src/
	docker-compose exec api mypy src/

format: ## Format code with black
	docker-compose exec api black src/

quality: format lint ## Run all code quality checks

# Shell access
shell: ## Open shell in API container
	docker-compose exec api bash

shell-mcp: ## Open shell in MCP container
	docker-compose exec mcp-server bash

shell-dev: ## Open shell in dev-tools container
	docker-compose run --rm dev-tools bash

# Database operations
redis-cli: ## Connect to Redis CLI
	docker-compose exec redis redis-cli

rabbitmq-status: ## Show RabbitMQ status
	docker-compose exec rabbitmq rabbitmqctl status

rabbitmq-queues: ## List RabbitMQ queues
	docker-compose exec rabbitmq rabbitmqctl list_queues

# Cleanup
clean: ## Stop services and remove volumes
	docker-compose down -v

clean-all: ## Complete cleanup (images, volumes, networks)
	docker-compose down -v --rmi all --remove-orphans

prune: ## Clean up Docker system
	docker system prune -f

# Monitoring
stats: ## Show container resource usage
	docker stats

health: ## Check service health
	@echo "API Health:"
	@curl -s http://localhost:8000/health | jq . || echo "API not responding"
	@echo "\nMCP Health:"
	@curl -s http://localhost:8001/health | jq . || echo "MCP not responding"

# Setup
setup: ## Initial setup (copy .env and build)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please edit it with your configuration."; \
	fi
	@echo "Building Docker images..."
	docker-compose build

init: setup ## Alias for setup

# Backup
backup: ## Backup Docker volumes
	@mkdir -p backups
	@echo "Backing up RabbitMQ data..."
	docker run --rm -v weave-nn_rabbitmq-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/rabbitmq-$(shell date +%Y%m%d-%H%M%S).tar.gz /data
	@echo "Backing up Redis data..."
	docker run --rm -v weave-nn_redis-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/redis-$(shell date +%Y%m%d-%H%M%S).tar.gz /data
	@echo "Backups saved to backups/"

# Documentation
docs: ## View documentation
	@echo "Documentation files:"
	@ls -lh docs/

# Quick commands
quick-test: ## Quick test without rebuilding
	docker-compose run --rm api pytest tests/ -v

quick-format: ## Quick format without rebuilding
	docker-compose run --rm api black src/

# Debugging
debug-api: ## Run API with debugger
	docker-compose run --rm -p 8000:8000 api python -m debugpy --listen 0.0.0.0:5678 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

inspect-api: ## Inspect API container
	docker inspect weave-nn-api | jq .

inspect-network: ## Inspect Docker network
	docker network inspect weave-nn_weave-network | jq .

# Configuration
env: ## Show environment variables (sanitized)
	@echo "Current configuration:"
	@cat .env 2>/dev/null | grep -v "PASSWORD\|SECRET\|KEY" || echo ".env file not found"

validate: ## Validate docker-compose files
	docker-compose config --quiet && echo "✅ Configuration valid" || echo "❌ Configuration invalid"
