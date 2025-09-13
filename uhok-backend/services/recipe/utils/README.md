# Recommend Service

레시피 추천 서비스 (하이브리드 추천 시스템)

## 주요 기능

### 1. 레시피명 기반 추천
- 정확한 레시피명 일치 우선 추천
- 벡터 유사도 기반 하이브리드 추천
- MariaDB와 PostgreSQL 연동

### 2. 식재료 기반 추천
- 사용자가 보유한 식재료 기반 레시피 추천
- 재료 매칭 알고리즘
- MariaDB 기반 처리

### 3. 임베딩 벡터 유사도
- **ML 서비스 분리**: SentenceTransformer 모델은 `uhok-ml-inference` 서비스로 분리
- 다국어 지원 (paraphrase-multilingual-MiniLM-L12-v2)
- pgvector를 활용한 벡터 유사도 계산

## 아키텍처

### 데이터베이스 구조
- **MariaDB**: 레시피 기본 정보, 재료 정보, 사용자 데이터
- **PostgreSQL**: 벡터 임베딩 데이터 (pgvector 확장)

### 추천 알고리즘
1. **1차 필터링**: 레시피명 정확 일치 (RANK_TYPE: 0)
2. **2차 필터링**: 벡터 유사도 기반 추천 (RANK_TYPE: 1)
3. **결과 병합**: 중복 제거 및 순위 정렬

## API 엔드포인트

### 추천 관련
- `POST /api/recommend/recipe` - 레시피명 기반 추천
- `POST /api/recommend/ingredient` - 식재료 기반 추천

## 핵심 컴포넌트

### 1. ML 서비스 연동
```python
# ML 서비스는 uhok-ml-inference로 분리됨
# 백엔드에서는 원격 ML 서비스를 호출하여 임베딩 생성
from .remote_ml_adapter import RemoteMLAdapter

adapter = RemoteMLAdapter()
embedding = await adapter._get_embedding_from_ml_service("갈비탕")
```

### 2. 레시피 추천 로직
```python
async def _get_recipe_recommendations(df: pd.DataFrame, query: str, top_k: int = 25) -> pd.DataFrame:
    """
    레시피명 기반 추천 로직 (내부용)
    - 레시피명 일치 우선 + 벡터 유사도 기반 하이브리드 추천
    """
```

## 데이터 흐름

### 레시피명 기반 추천
1. **MariaDB 쿼리**: `FCT_RECIPE` 테이블에서 레시피명 일치 검색
2. **벡터 인코딩**: 검색어를 임베딩 벡터로 변환
3. **PostgreSQL 쿼리**: `RECIPE_VECTOR_TABLE`에서 벡터 유사도 계산
4. **결과 병합**: 정확 일치 + 유사도 기반 결과 통합
5. **상세 정보 조회**: MariaDB에서 레시피 상세 정보 및 재료 정보 조회

### 식재료 기반 추천
1. **재료 매칭**: `FCT_MTRL` 테이블에서 식재료 기반 레시피 검색
2. **레시피 정보**: `FCT_RECIPE` 테이블에서 상세 정보 조회
3. **재료 정보**: `FCT_MTRL` 테이블에서 재료 상세 정보 조회

## 성능 최적화

### 1. ML 서비스 분리
- SentenceTransformer 모델은 별도 ML 서비스로 분리
- 백엔드 메모리 사용량 대폭 감소
- 독립적인 스케일링 가능

### 2. 벡터 유사도 계산
- PostgreSQL pgvector 확장 활용
- 효율적인 벡터 연산 및 인덱싱

### 3. 데이터베이스 연결 관리
- 공통 DB 서비스 활용 (`get_maria_service_db`, `get_postgres_log_db`)
- 연결 풀링 및 자동 관리

## 환경 설정

### 필요한 환경 변수
- `MARIADB_SERVICE_URL`: MariaDB 연결 정보
- `POSTGRES_URL`: PostgreSQL 연결 정보
- `ML_MODE`: ML 서비스 모드 (기본값: remote_embed)
- `ML_INFERENCE_URL`: ML 서비스 URL (기본값: http://ml-inference:8001)

### 의존성 패키지
```txt
# ML 관련 패키지는 uhok-ml-inference 서비스로 분리됨
pandas
numpy
httpx  # ML 서비스 호출용
```

## 사용 예시

### 레시피명 기반 추천
```python
from services.recommend.recommend_service import _get_recipe_recommendations

# 데이터프레임에서 레시피 추천
recommendations = await _get_recipe_recommendations(
    df=recipe_dataframe,
    query="김치찌개",
    top_k=25
)
```

### ML 서비스 연동
```python
from services.recipe.utils.remote_ml_adapter import RemoteMLAdapter

# 원격 ML 서비스 어댑터 생성
adapter = RemoteMLAdapter()

# 임베딩 생성 (ML 서비스 호출)
embedding = await adapter._get_embedding_from_ml_service("갈비탕")
```

## 주의사항

1. **ML 서비스 의존성**: ML 서비스가 실행 중이어야 함
2. **네트워크 연결**: 백엔드와 ML 서비스 간 네트워크 연결 필요
3. **벡터 차원**: 현재 384차원 벡터 사용
4. **데이터베이스 연결**: MariaDB와 PostgreSQL 모두 필요
5. **비동기 처리**: 모든 추천 함수는 비동기로 구현

## 향후 개선 계획

1. **벡터 인덱싱**: FAISS나 Annoy 등 벡터 인덱스 도입
2. **캐싱 레이어**: Redis를 활용한 추천 결과 캐싱
3. **개인화 추천**: 사용자 행동 데이터 기반 협업 필터링
4. **실시간 학습**: 사용자 피드백 기반 모델 업데이트