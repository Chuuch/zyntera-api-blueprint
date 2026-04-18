# Load environment variables from .env
include .env
export

.PHONY: up down migrate studio test

# Start the infrastructure
up:
	docker-compose up -d

# Shut down the infrastructure
down:
	docker-compose down -v

# Run database migrations
migrate:
	npx drizzle-kit migrate

# Open Drizzle Studio to view data
studio:
	npx drizzle-kit studio

# Run te full CI check locally
ci:
	npm run lint
	npm run build
	npm run test