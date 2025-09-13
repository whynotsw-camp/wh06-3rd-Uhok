# Docker Compose 명령어 정리 (V3 - 분리된 파일 구조)

## 파일 구조
- `docker-compose.web.yml`: 웹 서비스 (nginx, backend, frontend, redis)

## 기본 명령어 (순서대로)

### 1. 웹 서비스 빌드 및 실행
```bash
# 웹 서비스 이미지 빌드
docker compose -f docker-compose.web.yml build

# 특정 서비스 이미지 빌드
docker compose -f docker-compose.web.yml build backend

# 캐시 없이 강제 빌드
docker compose -f docker-compose.web.yml build --no-cache

# 빌드 후 즉시 시작
docker compose -f docker-compose.web.yml up --build

# 웹 서비스 시작 (백그라운드)
docker compose -f docker-compose.web.yml up -d

# 웹 서비스 시작 (포그라운드 - 로그 확인 가능)
docker compose -f docker-compose.web.yml up
```

### 2. 서비스 상태 확인
```bash
# 웹 서비스 상태 확인
docker compose -f docker-compose.web.yml ps

# 웹 서비스 로그 확인
docker compose -f docker-compose.web.yml logs

# 특정 서비스 로그 확인
docker compose -f docker-compose.web.yml logs backend

# 실시간 로그 확인
docker compose -f docker-compose.web.yml logs -f backend
```

### 3. 서비스 재시작
```bash
# 웹 서비스 재시작
docker compose -f docker-compose.web.yml restart

# 특정 서비스 재시작
docker compose -f docker-compose.web.yml restart backend

# 서비스 중지 후 다시 시작
docker compose -f docker-compose.web.yml stop backend
docker compose -f docker-compose.web.yml start backend
```

## 컨테이너 관리

### 4. 컨테이너 접속
```bash
# 웹 서비스 컨테이너 내부 접속
docker compose -f docker-compose.web.yml exec backend bash
docker compose -f docker-compose.web.yml exec frontend sh
docker compose -f docker-compose.web.yml exec nginx sh
docker compose -f docker-compose.web.yml exec redis redis-cli

# 컨테이너 내부에서 명령어 실행
docker compose -f docker-compose.web.yml exec backend python -c "print('Hello')"
```

### 5. 컨테이너 정보 확인
```bash
# 웹 서비스 설정 확인
docker compose -f docker-compose.web.yml config

# 특정 서비스 설정 확인
docker compose -f docker-compose.web.yml config backend
```

## 프로젝트별 명령어 (uhok 프로젝트)

### 6. 개발 환경 실행 (순서대로)
```bash
# 1단계: 웹 서비스 이미지 빌드
docker compose -f docker-compose.web.yml build

# 2단계: 웹 서비스 시작 (백엔드 + 프론트엔드 + nginx + redis)
docker compose -f docker-compose.web.yml up -d

# 접속 URL: http://localhost:80 (또는 http://localhost)
```

### 7. 개별 서비스 관리
```bash
# 웹 서비스 개별 관리
docker compose -f docker-compose.web.yml build backend
docker compose -f docker-compose.web.yml up -d backend

docker compose -f docker-compose.web.yml build frontend
docker compose -f docker-compose.web.yml up -d frontend

# nginx 시작 (이미지 빌드 불필요)
docker compose -f docker-compose.web.yml up -d nginx

# redis 시작 (이미지 빌드 불필요)
docker compose -f docker-compose.web.yml up -d redis
```

### 8. 로그 모니터링
```bash
# 웹 서비스 로그 확인
docker compose -f docker-compose.web.yml logs

# 특정 서비스 로그 확인
docker compose -f docker-compose.web.yml logs backend
docker compose -f docker-compose.web.yml logs frontend
docker compose -f docker-compose.web.yml logs nginx
docker compose -f docker-compose.web.yml logs redis

# 실시간 로그 확인
docker compose -f docker-compose.web.yml logs -f backend
docker compose -f docker-compose.web.yml logs -f frontend

# 특정 시간 이후 로그
docker compose -f docker-compose.web.yml logs --since="2025-09-08T06:00:00" backend

# 마지막 N줄 로그
docker compose -f docker-compose.web.yml logs --tail=50 backend
```

### 9. 문제 해결
```bash
# 웹 서비스 상태 확인
docker compose -f docker-compose.web.yml ps

# 컨테이너 리소스 사용량 확인
docker stats

# 특정 컨테이너 상세 정보
docker inspect uhok-deploy-backend-1

# 네트워크 확인
docker network ls
docker network inspect uhok-deploy_app_net
```

## 유용한 옵션들

### 10. 추가 옵션
```bash
# 웹 서비스 강제 재생성
docker compose -f docker-compose.web.yml up -d --force-recreate

# 특정 서비스만 강제 재생성
docker compose -f docker-compose.web.yml up -d --force-recreate backend

# 볼륨과 함께 완전 정리
docker compose -f docker-compose.web.yml down -v --remove-orphans

# 사용하지 않는 이미지 정리
docker image prune

# 모든 사용하지 않는 리소스 정리
docker system prune
```

## 환경 변수 관리

### 11. 환경 설정
```bash
# 웹 서비스 환경 변수 파일 지정
docker compose -f docker-compose.web.yml --env-file .env up -d

# 특정 환경 변수 오버라이드
docker compose -f docker-compose.web.yml up -d -e DEBUG=1
```

## 백업 및 복원

### 12. 데이터 백업
```bash
# 볼륨 백업
docker run --rm -v uhok-deploy_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .

# 볼륨 복원
docker run --rm -v uhok-deploy_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data
```

## 트러블슈팅

### 13. 일반적인 문제 해결
```bash
# 포트 충돌 확인
netstat -tulpn | grep :80

# 웹 서비스 로그에서 에러 확인
docker compose -f docker-compose.web.yml logs | grep -i error

# 컨테이너 리소스 사용량 확인
docker stats --no-stream

# 네트워크 연결 테스트
docker compose -f docker-compose.web.yml exec nginx ping backend

# Redis 연결 테스트
docker compose -f docker-compose.web.yml exec redis redis-cli ping

```

### 14. 자주 발생하는 오류와 해결방법

#### 이미지 참조 오류
```bash
# 오류: unable to get image 'nginx:1.25-alpine:0.1.0': invalid reference format
# 해결: docker-compose.yml에서 이미지 태그 형식 확인
# 올바른 형식: nginx:1.25-alpine
# 잘못된 형식: nginx:1.25-alpine:0.1.0
```

#### 빌드 컨텍스트 오류
```bash
# 오류: build path does not exist
# 해결: 상대 경로 확인 및 디렉토리 존재 여부 확인
ls -la ../uhok-backend
ls -la ../uhok-frontend
```

#### 포트 충돌
```bash
# 오류: port is already allocated
# 해결: 사용 중인 포트 확인 및 변경
netstat -tulpn | grep :80
# docker-compose.yml에서 포트 번호 변경
```

#### 권한 오류
```bash
# 오류: permission denied
# 해결: Docker 데몬 실행 상태 확인
docker version
# Windows: Docker Desktop 실행 확인
```

---

## 빠른 참조 (순서대로)

| 명령어 | 설명 |
|--------|------|
| `docker compose -f docker-compose.web.yml build` | 웹 서비스 이미지 빌드 |
| `docker compose -f docker-compose.ml.yml build` | ML 서비스 이미지 빌드 |
| `docker compose -f docker-compose.web.yml up -d` | 웹 서비스 시작 |
| `docker compose -f docker-compose.ml.yml up -d` | ML 서비스 시작 |
| `docker compose -f docker-compose.web.yml -f docker-compose.ml.yml up -d` | 모든 서비스 시작 |
| `docker compose -f docker-compose.web.yml ps` | 웹 서비스 상태 확인 |
| `docker compose -f docker-compose.ml.yml ps` | ML 서비스 상태 확인 |
| `docker compose -f docker-compose.web.yml logs -f` | 웹 서비스 실시간 로그 |
| `docker compose -f docker-compose.ml.yml logs -f` | ML 서비스 실시간 로그 |
| `docker compose -f docker-compose.web.yml restart` | 웹 서비스 재시작 |
| `docker compose -f docker-compose.ml.yml restart` | ML 서비스 재시작 |
| `docker compose -f docker-compose.web.yml -f docker-compose.ml.yml down` | 모든 서비스 중지 |
| `docker compose -f docker-compose.web.yml exec <service> bash` | 웹 서비스 컨테이너 접속 |
| `docker compose -f docker-compose.ml.yml exec ml_inference bash` | ML 서비스 컨테이너 접속 |

## 프로젝트 구조
- **backend**: Python 백엔드 서비스 (포트 9000) - 웹 서비스
- **frontend**: 프론트엔드 서비스 (포트 80) - 웹 서비스
- **nginx**: Nginx 리버스 프록시 (포트 80) - 웹 서비스
- **redis**: Redis 서비스 (포트 6379) - 웹 서비스
- **ml_inference**: ML 추론 서비스 (포트 8001) - ML 서비스
- **app_net**: 서비스 간 통신을 위한 브리지 네트워크

## Redis 및 Nginx 전용 명령어

### 16. Redis 관리
```bash
# Redis 서비스 시작
docker compose -f docker-compose.web.yml up -d redis

# Redis 서비스 중지
docker compose -f docker-compose.web.yml stop redis

# Redis 서비스 재시작
docker compose -f docker-compose.web.yml restart redis

# Redis CLI 접속
docker compose -f docker-compose.web.yml exec redis redis-cli

# Redis 상태 확인
docker compose -f docker-compose.web.yml exec redis redis-cli ping

# Redis 데이터 확인
docker compose -f docker-compose.web.yml exec redis redis-cli keys "*"

# Redis 메모리 사용량 확인
docker compose -f docker-compose.web.yml exec redis redis-cli info memory
```

### 17. Nginx 관리
```bash
# Nginx 서비스 시작
docker compose -f docker-compose.web.yml up -d nginx

# Nginx 서비스 중지
docker compose -f docker-compose.web.yml stop nginx

# Nginx 서비스 재시작
docker compose -f docker-compose.web.yml restart nginx

# Nginx 설정 테스트
docker compose -f docker-compose.web.yml exec nginx nginx -t

# Nginx 설정 리로드
docker compose -f docker-compose.web.yml exec nginx nginx -s reload

# Nginx 상태 확인
docker compose -f docker-compose.web.yml exec nginx nginx -s status

# Nginx 접근 로그 확인
docker compose -f docker-compose.web.yml logs -f nginx
```

### 18. Redis와 Nginx 함께 관리
```bash
# Redis와 Nginx 동시 시작
docker compose -f docker-compose.web.yml up -d redis nginx

# Redis와 Nginx 동시 중지
docker compose -f docker-compose.web.yml stop redis nginx

# Redis와 Nginx 동시 재시작
docker compose -f docker-compose.web.yml restart redis nginx

# Redis와 Nginx 상태 확인
docker compose -f docker-compose.web.yml ps redis nginx
```

### 19. 웹 서비스 실행 옵션
```bash
# 웹 서비스 시작 (backend, frontend, nginx, redis)
docker compose -f docker-compose.web.yml up -d

# 웹 서비스 빌드 및 시작
docker compose -f docker-compose.web.yml up -d --build
```
