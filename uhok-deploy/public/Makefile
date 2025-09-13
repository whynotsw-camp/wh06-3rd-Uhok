SHELL := /bin/bash
.ONESHELL:
COMPOSE ?= docker compose
CURL    ?= curl -s

# 서비스 정의
WEB_SERVICES = nginx backend frontend redis
ML_SERVICES = ml-inference
APP_SERVICES = $(WEB_SERVICES)
ALL_SERVICES = $(WEB_SERVICES) $(ML_SERVICES)

.PHONY: up up-backend up-frontend up-nginx up-ml up-app start stop down down-v restart-backend restart-frontend restart-nginx restart-redis restart-ml logs health status nginx-reload prune-light prune-hard migrate shell-backend clean help

up:
	# """
	# 웹 서비스(백엔드/프론트엔드/nginx/redis) 이미지를 병렬로 빌드하고, 모든 서비스를 기동한 뒤 기본 헬스를 점검합니다.
	# 비동기 처리: build를 &로 병렬 실행 후 wait.
	# """
	($(COMPOSE) -f docker-compose.public.yml build backend & $(COMPOSE) -f docker-compose.public.yml build frontend & wait)
	$(COMPOSE) -f docker-compose.public.yml up -d
	$(MAKE) health

up-backend:
	# """
	# 백엔드만 새로 빌드 후 기동합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build backend
	$(COMPOSE) -f docker-compose.public.yml ps
	-$(CURL) http://localhost/api/health || true

up-frontend:
	# """
	# 프론트엔드만 새로 빌드 후 기동합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build frontend
	$(COMPOSE) -f docker-compose.public.yml ps
	-$(CURL) -I http://localhost/ | head -n 1 || true

up-nginx:
	# """
	# nginx만 새로 빌드 후 기동합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build nginx
	$(COMPOSE) -f docker-compose.public.yml ps
	-$(CURL) -I http://localhost/ | head -n 1 || true
	-$(CURL) -I http://localhost/api/docs | head -n 1 || true

up-ml:
	# """
	# ML 추론 서비스만 새로 빌드 후 기동합니다.
	# """
	$(COMPOSE) -f ../ml/docker-compose.ml.yml up -d --build
	$(COMPOSE) -f ../ml/docker-compose.ml.yml ps
	-$(CURL) http://localhost:8001/health || true

up-app:
	# """
	# 앱 서비스(백엔드/프론트엔드/nginx/redis)를 기동합니다.
	# """
	$(COMPOSE) -f ../app/docker-compose.app.yml up -d
	$(COMPOSE) -f ../app/docker-compose.app.yml ps


start:
	# """
	# 정지된 컨테이너를 다시 시작합니다. 없으면 up -d로 대체합니다.
	# """
	-$(COMPOSE) -f docker-compose.public.yml start || $(COMPOSE) -f docker-compose.public.yml up -d
	$(MAKE) health

stop:
	# """
	# 모든 서비스를 일시 중지합니다(이미지/볼륨 유지).
	# """
	$(COMPOSE) -f docker-compose.public.yml stop
	$(COMPOSE) -f docker-compose.public.yml ps

down:
	# """
	# 컨테이너와 네트워크를 제거하며 종료합니다(이미지/볼륨 보존).
	# """
	$(COMPOSE) -f docker-compose.public.yml down

down-v:
	# """
	# 컨테이너/네트워크/볼륨까지 제거합니다(데이터 삭제 주의).
	# """
	$(COMPOSE) -f docker-compose.public.yml down -v

restart-backend:
	# """
	# 백엔드만 재빌드/재기동 후 헬스 확인합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build backend
	-$(CURL) http://localhost/api/health || true

restart-frontend:
	# """
	# 프론트엔드만 재빌드/재기동 후 루트 응답을 확인합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build frontend
	-$(CURL) -I http://localhost/ | head -n 1 || true

restart-nginx:
	# """
	# nginx만 재빌드/재기동 후 루트/문서 응답을 확인합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml up -d --build nginx
	-$(CURL) -I http://localhost/ | head -n 1 || true
	-$(CURL) -I http://localhost/api/docs | head -n 1 || true

restart-ml:
	# """
	# ML 추론 서비스만 재빌드/재기동 후 헬스 확인합니다.
	# """
	$(COMPOSE) -f ../ml/docker-compose.ml.yml up -d --build
	-$(CURL) http://localhost:8001/health || true

restart-redis:
	# """
	# Redis 서비스만 재기동합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml restart redis

logs:
	# """
	# 웹 서비스(백엔드/프론트엔드/nginx/redis) 로그를 동시에 실시간 팔로우합니다. 종료: Ctrl+C
	# 비동기 처리: 로그를 &로 병렬 실행 후 wait.
	# """
	trap "exit 0" INT; \
	($(COMPOSE) -f docker-compose.public.yml logs -f --tail=200 backend & \
	 $(COMPOSE) -f docker-compose.public.yml logs -f --tail=200 frontend & \
	 $(COMPOSE) -f docker-compose.public.yml logs -f --tail=200 nginx & \
	 $(COMPOSE) -f docker-compose.public.yml logs -f --tail=200 redis & \
	 wait)

logs-ml:
	# """
	# ML 추론 서비스 로그를 실시간 팔로우합니다. 종료: Ctrl+C
	# """
	$(COMPOSE) -f ../ml/docker-compose.ml.yml logs -f --tail=200


health:
	# """
	# 프록시 경유로 헬스/문서/루트 응답을 점검합니다.
	# """
	-$(CURL) http://localhost/api/health || true
	-$(CURL) -I http://localhost/api/docs | head -n 1 || true
	-$(CURL) -I http://localhost/ | head -n 1 || true

status:
	# """
	# 현재 Compose 서비스들의 상태를 표시합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml ps

status-ml:
	# """
	# ML 추론 서비스 상태를 표시합니다.
	# """
	$(COMPOSE) -f ../ml/docker-compose.ml.yml ps

nginx-reload:
	# """
	# nginx.conf 변경을 무중단 반영합니다. 실패 시 컨테이너 재시작으로 대체합니다.
	# """
	-$(COMPOSE) -f docker-compose.public.yml exec -T nginx nginx -s reload || $(COMPOSE) -f docker-compose.public.yml restart nginx

prune-light:
	# """
	# 사용하지 않는 이미지/네트워크/빌드 캐시를 정리합니다(데이터 보존).
	# """
	docker system prune -f

prune-hard:
	# """
	# 모든 미사용 이미지와 볼륨까지 강력 정리합니다(데이터 삭제 주의).
	# """
	docker system prune -a -f
	docker volume prune -f

migrate:
	# """
	# 백엔드 컨테이너에서 Alembic 마이그레이션을 실행합니다(ini 존재 시).
	# """
	$(COMPOSE) -f docker-compose.public.yml exec -T backend bash -lc 'set -e; \
	  if [ -f alembic_mariadb_auth.ini ]; then echo "▶ MariaDB AUTH"; alembic -c alembic_mariadb_auth.ini upgrade head; fi; \
	  if [ -f alembic_postgres_log.ini ]; then echo "▶ PostgreSQL LOG"; alembic -c alembic_postgres_log.ini upgrade head; fi'

# 추가 유틸리티 명령어들
shell-backend:
	# """
	# 백엔드 컨테이너에 bash 셸로 접속합니다.
	# """
	$(COMPOSE) -f docker-compose.public.yml exec backend bash

shell-ml:
	# """
	# ML 추론 서비스 컨테이너에 bash 셸로 접속합니다.
	# """
	$(COMPOSE) -f ../ml/docker-compose.ml.yml exec ml-inference bash


clean:
	# """
	# 모든 컨테이너와 이미지를 정리합니다.
	# """
	$(MAKE) down-v
	$(COMPOSE) -f ../ml/docker-compose.ml.yml down -v
	docker system prune -a -f
	docker volume prune -f

help:
	# """
	# 사용 가능한 모든 명령어를 표시합니다.
	# """
	@echo "=== UHOK 프로젝트 Makefile 도움말 ==="
	@echo ""
	@echo "기본 명령어:"
	@echo "  make up          - 웹 서비스 시작 (backend, frontend, nginx, redis)"
	@echo "  make up-ml       - ML 추론 서비스 시작"
	@echo "  make up-app      - 앱 서비스 시작"
	@echo "  make start       - 정지된 서비스 재시작"
	@echo "  make stop        - 모든 서비스 일시 중지"
	@echo "  make down        - 컨테이너와 네트워크 제거"
	@echo "  make down-v      - 컨테이너/네트워크/볼륨 제거"
	@echo ""
	@echo "개별 서비스 관리:"
	@echo "  make up-backend    - 백엔드만 시작"
	@echo "  make up-frontend   - 프론트엔드만 시작"
	@echo "  make up-nginx      - nginx만 시작"
	@echo "  make restart-*     - 각 서비스 재시작"
	@echo "  make restart-ml    - ML 추론 서비스 재시작"
	@echo ""
	@echo "로그 및 상태:"
	@echo "  make logs          - 웹 서비스 로그 보기"
	@echo "  make logs-ml       - ML 추론 서비스 로그 보기"
	@echo "  make health        - 서비스 헬스 체크"
	@echo "  make status        - 웹 서비스 상태 확인"
	@echo "  make status-ml     - ML 추론 서비스 상태 확인"
	@echo ""
	@echo "유틸리티:"
	@echo "  make migrate       - 데이터베이스 마이그레이션"
	@echo "  make nginx-reload  - nginx 설정 재로드"
	@echo "  make shell-backend - 백엔드 컨테이너 접속"
	@echo "  make shell-ml      - ML 추론 서비스 컨테이너 접속"
	@echo "  make clean         - 모든 리소스 정리"
	@echo "  make prune-light   - 가벼운 정리"
	@echo "  make prune-hard    - 강력한 정리"
