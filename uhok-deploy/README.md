# UHOK 배포 환경 (Docker Compose)

UHOK 프로젝트의 전체 스택을 Docker Compose로 관리하는 배포 환경입니다. 백엔드, 프론트엔드, ML 추론 서비스, Redis, Nginx를 포함한 마이크로서비스 아키텍처를 제공합니다.

## 🎯 프로젝트 개요

UHOK는 레시피 추천 플랫폼으로, 사용자가 보유한 재료를 기반으로 최적의 레시피를 추천하는 서비스입니다. 마이크로서비스 아키텍처를 통해 확장성과 유지보수성을 확보했습니다.

## 📁 폴더 구조

```
uhok-deploy/
├── app/                          # 앱 서비스 (백엔드, 프론트엔드, Redis)
│   ├── .env.backend
│   └── docker-compose.app.yml
├── ml/                           # ML 추론 서비스
│   └── docker-compose.ml.yml
└── public/                       # 공개 서비스 (Nginx, 전체 통합)
    ├── .env.public
    ├── docker-compose.public.yml
    ├── nginx.conf
    ├── Makefile
    └── docker-compose-commands.md
```

### 주요 파일
- `public/docker-compose.public.yml` - 전체 웹 서비스 (백엔드, 프론트엔드, Nginx, Redis)
- `app/docker-compose.app.yml` - 앱 서비스 (백엔드, 프론트엔드, Redis)
- `ml/docker-compose.ml.yml` - ML 추론 서비스
- `public/Makefile` - 자주 사용하는 Docker Compose 명령어 단축키
- `public/nginx.conf` - Nginx 리버스 프록시 설정

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Inference  │
│   (React)       │    │   (FastAPI)     │    │   (Python)      │
│   Port: 80      │    │   Port: 9000    │    │   Port: 8001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (Reverse Proxy)│
                    │   Port: 80      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 🚀 서비스 구성

### 공개 서비스 (public/)
- **nginx** (nginx:1.25-alpine) - 리버스 프록시 및 로드 밸런서
- **backend** (uhok-backend:2.0.1) - Python FastAPI 백엔드 서비스
- **frontend** (uhok-frontend:3.0.0) - React 프론트엔드 애플리케이션
- **redis** (redis:7-alpine) - 캐시 및 세션 저장소 (프로필: `with-redis`)

### 앱 서비스 (app/)
- **backend** (uhok-backend:2.0.1) - Python FastAPI 백엔드 서비스
- **frontend** (uhok-frontend:3.0.0) - React 프론트엔드 애플리케이션
- **redis** (redis:7-alpine) - 캐시 및 세션 저장소

### ML 서비스 (ml/)
- **ml-inference** (uhok-ml-inference:latest) - Python ML 추론 서비스

## 🔧 빠른 시작

### 1. 전체 서비스 실행 (공개 서비스)
```bash
# public 폴더에서 실행
cd public
docker compose -f docker-compose.public.yml up -d

# 또는 Makefile 사용 (권장)
make up
```

### 2. 개별 서비스 실행
```bash
# 앱 서비스만 실행
cd app
docker compose -f docker-compose.app.yml up -d

# ML 추론 서비스만 실행
cd ml
docker compose -f docker-compose.ml.yml up -d
```

### 3. Redis 포함 실행
```bash
# Redis와 함께 실행
docker compose -f docker-compose.public.yml --profile with-redis up -d
```

### 4. 접속 확인
- **웹 애플리케이션**: http://localhost
- **API 문서**: http://localhost/api/docs
- **API 헬스체크**: http://localhost/api/health
- **ML 서비스**: http://localhost:8001 (직접 접근)

## 🎯 주요 기능

### 백엔드 서비스 (uhok-backend)
- **레시피 추천 API**: 재료 기반 레시피 추천
- **사용자 관리**: 인증 및 권한 관리
- **데이터베이스 연동**: MariaDB, PostgreSQL 지원
- **외부 ML 서비스 연동**: 별도 EC2의 ML 추론 서비스와 통신

### 프론트엔드 서비스 (uhok-frontend)
- **반응형 웹 UI**: 모바일/데스크톱 지원
- **레시피 검색**: 키워드 및 재료 기반 검색
- **사용자 인터페이스**: 직관적인 사용자 경험

## 📋 Makefile 명령어

### 기본 명령어
```bash
make up              # 웹 서비스 빌드 및 실행 (public/)
make up-ml           # ML 추론 서비스 실행
make up-app          # 앱 서비스 실행
make start           # 정지된 서비스 재시작
make stop            # 모든 서비스 일시 중지
make down            # 컨테이너 및 네트워크 제거
make down-v          # 볼륨까지 완전 제거
```

### 개별 서비스 관리
```bash
make up-backend      # 백엔드만 빌드 및 실행
make up-frontend     # 프론트엔드만 빌드 및 실행
make up-nginx        # Nginx만 빌드 및 실행
```

### 재시작 명령어
```bash
make restart-backend # 백엔드 재빌드 및 재시작
make restart-frontend # 프론트엔드 재빌드 및 재시작
make restart-nginx   # Nginx 재빌드 및 재시작
make restart-ml      # ML 추론 서비스 재시작
```

### 모니터링 및 관리
```bash
make logs            # 웹 서비스 로그 실시간 확인
make logs-ml         # ML 추론 서비스 로그 확인
make health          # 서비스 헬스체크
make status          # 웹 서비스 상태 확인
make status-ml       # ML 추론 서비스 상태 확인
make nginx-reload    # Nginx 설정 무중단 리로드
```

### 정리 명령어
```bash
make prune-light     # 사용하지 않는 이미지/네트워크 정리
make prune-hard      # 모든 미사용 리소스 강력 정리
make migrate         # 데이터베이스 마이그레이션 실행
```

## 🔍 서비스 상세 정보

### Backend (uhok-backend)
- **포트**: 9000 (내부)
- **헬스체크**: `/api/health`
- **환경변수**: `../uhok-backend/.env` 파일 사용
- **의존성**: MariaDB, PostgreSQL (외부)

### Frontend (uhok-frontend)
- **포트**: 80 (내부)
- **빌드**: React 애플리케이션
- **정적 파일**: Nginx를 통해 서빙

### ML Inference (uhok-ml-inference)
- **포트**: 8001 (외부 노출)
- **헬스체크**: `/health`
- **환경변수**: `../uhok-ml-inference/.env` 파일 사용
- **역할**: 머신러닝 모델 추론 서비스

### Redis
- **포트**: 6379 (내부)
- **볼륨**: `redis_data` (데이터 영속성)
- **프로필**: `with-redis`

### Nginx
- **포트**: 80 (외부 노출)
- **역할**: 리버스 프록시, 로드 밸런서
- **설정**: `nginx.conf`

## 🌐 라우팅 설정

### API 요청
```
http://localhost/api/* → backend:9000/api/*
```

### 문서 및 스키마
```
http://localhost/docs → backend:9000/docs
http://localhost/redoc → backend:9000/redoc
http://localhost/openapi.json → backend:9000/openapi.json
```

### 프론트엔드
```
http://localhost/ → frontend:80/
```

### ML 서비스 (직접 접근)
```
http://localhost:8001/* → ml-inference:8001/*
```

## 🔧 환경 설정

### 환경 변수 파일
각 서비스는 해당 디렉토리의 `.env` 파일을 사용합니다:
- `../uhok-backend/.env` - 백엔드 설정
- `../uhok-frontend/.env` - 프론트엔드 설정 (필요시)
- `../uhok-ml-inference/.env` - ML 추론 서비스 설정

### 네트워크
- **app_net**: 모든 서비스가 통신하는 브리지 네트워크
- **외부 접근**: Nginx를 통해서만 가능 (포트 80)

## 📊 모니터링

### 로그 확인
```bash
# 웹 서비스 로그
make logs

# ML 추론 서비스 로그
make logs-ml

# 특정 서비스 로그
docker compose -f docker-compose.public.yml logs -f backend
docker compose -f docker-compose.public.yml logs -f frontend
docker compose -f docker-compose.public.yml logs -f nginx
docker compose -f ../ml/docker-compose.ml.yml logs -f ml-inference
```

### 헬스체크
```bash
# 전체 헬스체크
make health

# 웹 서비스 상태
make status

# ML 추론 서비스 상태
make status-ml
```

### 리소스 사용량
```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너 상세 정보
docker inspect uhok-backend
```

## 🚨 문제 해결

### 일반적인 문제
1. **포트 충돌**: 80번 포트가 사용 중인 경우
   ```bash
   netstat -tulpn | grep :80
   ```

2. **이미지 빌드 실패**: Dockerfile 경로 확인
   ```bash
   ls -la ../uhok-backend/Dockerfile
   ls -la ../uhok-frontend/Dockerfile
   ```

3. **서비스 연결 실패**: 네트워크 확인
   ```bash
   docker network ls
   docker network inspect uhok-deploy_app_net
   ```

### 로그 확인
```bash
# 에러 로그 필터링
docker compose logs | grep -i error

# 특정 서비스 에러
docker compose logs backend | grep -i error
```

## 🔄 개발 워크플로우

### 코드 변경 시
```bash
# 백엔드 변경 후
make restart-backend

# 프론트엔드 변경 후
make restart-frontend

# ML 추론 서비스 변경 후
make restart-ml

# Nginx 설정 변경 후
make nginx-reload
```

### 데이터베이스 마이그레이션
```bash
# 마이그레이션 실행
make migrate
```

## 📝 추가 정보

- **Docker Compose 버전**: 2.x 이상 필요
- **최소 메모리**: 4GB 권장
- **디스크 공간**: 10GB 이상 권장
- **지원 OS**: Linux, macOS, Windows (Docker Desktop)

## 🔗 관련 문서

- [Docker Compose 명령어 가이드](public/docker-compose-commands.md)
- [Nginx 설정](public/nginx.conf)
- [백엔드 서비스](../uhok-backend/README.md)
- [프론트엔드 서비스](../uhok-frontend/README.md)
- [ML 추론 서비스](../uhok-ml-inference/README.md)
