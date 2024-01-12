# 최신 Node.js 이미지 사용
FROM node:latest

# 작업 디렉토리 설정
WORKDIR /app

# 현재 디렉토리의 모든 파일을 컨테이너의 /app 디렉토리로 복사
COPY . .

# 필요한 npm 패키지 설치
RUN npm install

# 애플리케이션 실행
CMD ["node", "index.js"]