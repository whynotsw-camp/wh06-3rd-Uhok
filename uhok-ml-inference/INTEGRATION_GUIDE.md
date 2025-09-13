# ML 서비스 통합 가이드

## 🎯 개요

이 가이드는 백엔드에서 무거운 ML 모델을 별도 서비스로 분리하여 EC2 비용을 절약하는 방법을 설명합니다.

## 📋 구현 완료 사항

### ✅ ML Inference 서비스
- **위치**: `uhok-ml-inference/`
- **기술**: FastAPI + SentenceTransformer
- **기능**: 텍스트 임베딩 생성 API
- **모델**: paraphrase-multilingual-MiniLM-L12-v2 (384차원)

### ✅ 백엔드 어댑터
- **위치**: `uhok-backend/services/recipe/utils/remote_ml_adapter.py`
- **기능**: 원격 ML 서비스 호출 및 PostgreSQL pgvector 검색
- **환경변수**: `ML_MODE`로 로컬/원격 모드 전환

### ✅ Docker 통합
- **위치**: `uhok-deploy/docker-compose.yml`
- **서비스**: `ml-inference` (프로필: `with-ml`)
- **네트워크**: 내부 통신만 허용 (보안)

## 🚀 실행 방법

### 1. 개발 환경 (로컬 모드)
```bash
# 백엔드만 실행 (기존 방식)
cd uhok-deploy
docker-compose up -d

# 백엔드 환경변수: ML_MODE=local (기본값)
```

### 2. 운영 환경 (원격 모드)
```bash
# ML 서비스 포함 실행
cd uhok-deploy
docker-compose --profile with-ml up -d

# 백엔드 환경변수 설정
echo "ML_MODE=remote_embed" >> uhok-backend/.env
echo "ML_INFERENCE_URL=http://ml-inference:8001" >> uhok-backend/.env
```

## 🧪 테스트 방법

### 1. ML 서비스 단독 테스트
```bash
# ML 서비스 빌드 및 실행
cd uhok-ml-inference
docker build -t uhok-ml-inference .
docker run -p 8001:8001 uhok-ml-inference

# 테스트 스크립트 실행
python test_ml_service.py
```

### 2. 백엔드 연동 테스트
```bash
# ML 서비스 실행 (별도 터미널)
cd uhok-ml-inference
docker run -p 8001:8001 uhok-ml-inference

# 백엔드 테스트
cd uhok-backend
python test_remote_ml.py
```

### 3. 통합 테스트
```bash
# 전체 서비스 실행
cd uhok-deploy
docker-compose --profile with-ml up -d

# 헬스체크
curl http://localhost:5000/api/health  # 백엔드
curl http://localhost:8001/health      # ML 서비스 (포트 포워딩 필요)
```

## 📊 성능 비교

### 메모리 사용량
- **기존 (로컬 모드)**: 백엔드 2-3GB (모델 포함)
- **분리 후**: 백엔드 500MB, ML 서비스 1-2GB
- **절약**: 백엔드 메모리 50-70% 감소

### 응답 시간
- **로컬 모드**: 첫 요청 10-30초 (모델 로딩), 이후 100-300ms
- **원격 모드**: 첫 요청 10-30초 (모델 로딩), 이후 200-500ms (네트워크 포함)

### 비용 절약
- **EC2 인스턴스**: 백엔드용 더 작은 인스턴스 사용 가능
- **스케일링**: ML 서비스 독립적 스케일링
- **배포**: 모델 업데이트 시 백엔드 영향 최소화

## 🔧 환경 변수 설정

### 백엔드 (.env)
```bash
# ML 서비스 모드 설정
ML_MODE=remote_embed              # local, remote_embed, remote_store

# 원격 ML 서비스 설정 (remote_* 모드에서 사용)
ML_INFERENCE_URL=http://ml-inference:8001
ML_TIMEOUT=3.0
ML_RETRIES=2
```

### ML 서비스 (Docker 환경변수)
```bash
HF_HOME=/models/hf_cache          # 모델 캐시 디렉토리
PYTHONUNBUFFERED=1               # 로그 실시간 출력
```

## 🚨 주의사항

### 1. 네트워크 의존성
- ML 서비스 장애 시 백엔드 추천 기능 중단
- **해결책**: 타임아웃, 재시도, 폴백 메커니즘 구현

### 2. 모델 로딩 시간
- 첫 요청 시 10-30초 지연 (콜드스타트)
- **해결책**: 헬스체크로 워밍업, 모델 미리 로딩

### 3. 메모리 사용량
- ML 서비스: 1-2GB 메모리 필요
- **해결책**: 적절한 인스턴스 타입 선택

### 4. 보안
- ML 서비스는 내부 네트워크에서만 접근
- **해결책**: VPC, 보안 그룹 설정

## 📈 모니터링

### 로그 확인
```bash
# ML 서비스 로그
docker-compose logs -f ml-inference

# 백엔드 ML 호출 로그
docker-compose logs -f backend | grep -i "ml\|embedding\|remote"
```

### 메트릭 수집
- ML 서비스: 요청 수, 응답 시간, 에러율
- 백엔드: ML 호출 성공/실패율, 타임아웃 발생률

### 알림 설정
- ML 서비스 헬스체크 실패
- 응답 시간 임계치 초과
- 에러율 임계치 초과

## 🔄 롤백 계획

### 긴급 롤백
```bash
# 환경변수만 변경하여 즉시 롤백
echo "ML_MODE=local" > uhok-backend/.env
docker-compose restart backend
```

### 점진적 전환
1. **Shadow 모드**: 기존/신규 모두 실행하여 결과 비교
2. **부분 트래픽**: 10% → 50% → 100% 점차 전환
3. **자동 폴백**: 에러율/지연 임계치 초과 시 자동 롤백

## 🎉 완료 체크리스트

- [x] ML Inference 서비스 구현
- [x] 백엔드 원격 어댑터 구현
- [x] Docker Compose 통합
- [x] 환경 변수 설정
- [x] 테스트 스크립트 작성
- [x] 문서화 완료

## 📞 지원

문제 발생 시:
1. 로그 확인: `docker-compose logs -f ml-inference`
2. 헬스체크: `curl http://localhost:8001/health`
3. 네트워크 확인: `docker-compose exec backend ping ml-inference`
4. 환경변수 확인: `docker-compose exec backend env | grep ML_`
