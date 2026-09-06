PHONY: build

start:
	docker compose up -d

api:
	docker compose exec api bash

web:
	docker compose exec web bash