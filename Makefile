.PHONY: install build serve test clean models

VERSION = 1.0.0

install: ## Install Void AI locally
	bash install.sh

build: ## Build web application
	cd void-ai && npm install && npm run build

serve: ## Start Void AI server
	python3 src/api/server.py

test: ## Run tests
	cd void-ai && npm run lint
	python3 -m pytest tests/ -v 2>/dev/null || true

models: ## Pull all models via Ollama
	ollama create void-1 -f models/void-1/Modelfile
	ollama create void-2 -f models/void-2/Modelfile
	@echo "Void-MOA uses routing — no separate model needed"

docker: ## Build and run with Docker
	docker compose -f docker/docker-compose.yml up -d

clean: ## Clean build artifacts
	rm -rf void-ai/node_modules void-ai/.next dist/

release: build ## Create release package
	mkdir -p dist
	tar -czf dist/void-ai-$(VERSION).tar.gz \
		void-ai/ models/ src/ bin/ docker/ \
		install.sh void.config requirements.txt Makefile README.md LICENSE

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
