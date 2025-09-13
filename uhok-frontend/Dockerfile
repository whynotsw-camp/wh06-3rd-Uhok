# syntax=docker/dockerfile:1.7

########## 1) Build Stage ##########
FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 안정성
ENV CI=false NODE_ENV=production

# npm 캐시 활용 (BuildKit 필요)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --silent

# 소스 복사 후 빌드
COPY . .
# 정적 자산 빌드
RUN npm run build

# (선택) 정적 gzip 미리 생성 → Nginx가 바로 서빙 가능
# - js/css/html/svg/ico만 예시로 압축
RUN apk add --no-cache gzip && \
    find build -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" -o -name "*.ico" \) \
      -exec gzip -9 -k {} \;

########## 2) Runtime (Nginx) ##########
FROM nginx:1.25-alpine AS production

# 헬스체크용 curl (경량)
RUN apk add --no-cache curl

# SPA 친화적인 nginx conf (아래에 예시 제공)
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드 산출물 복사
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

# 헬스체크: 루트 문서가 200이면 OK
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
