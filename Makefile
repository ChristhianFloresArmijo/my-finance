PHONY: build

start:
	docker compose up -d

api:
	docker compose exec app bash

web:
	docker compose exec app bash