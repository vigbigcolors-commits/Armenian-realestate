# SmartEstate Armenia — команды управления
# Использование: make <команда>

.PHONY: help setup start stop restart logs db-shell parser-run clean

help:
	@echo ""
	@echo "SmartEstate Armenia — команды:"
	@echo ""
	@echo "  make setup        — первая настройка (скопировать .env)"
	@echo "  make start        — запустить всё (БД + API + парсер + бот)"
	@echo "  make stop         — остановить всё"
	@echo "  make restart      — перезапустить"
	@echo "  make logs         — смотреть логи всех сервисов"
	@echo "  make logs-parser  — только логи парсера"
	@echo "  make db-shell     — войти в базу данных (psql)"
	@echo "  make parser-run   — запустить парсер один раз вручную"
	@echo "  make clean        — удалить все данные (ОСТОРОЖНО!)"
	@echo ""

setup:
	@if not exist .env (copy .env.example .env && echo ".env создан. Заполните его перед запуском!") else (echo ".env уже существует")

start:
	docker compose up -d --build
	@echo ""
	@echo "✅ Запущено!"
	@echo "   API:      http://localhost:8000"
	@echo "   API Docs: http://localhost:8000/docs"
	@echo "   БД:       localhost:5432"
	@echo ""

stop:
	docker compose down

restart:
	docker compose down
	docker compose up -d --build

logs:
	docker compose logs -f

logs-parser:
	docker compose logs -f parser

logs-api:
	docker compose logs -f api

logs-bot:
	docker compose logs -f bot

db-shell:
	docker compose exec postgres psql -U smartestate -d smartestate

parser-run:
	docker compose exec parser python main.py

clean:
	@echo "⚠️  Это удалит ВСЕ данные базы данных!"
	docker compose down -v
