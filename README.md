# 🌆 Seoul Now

서울에서 열리는 전시, 공연, 축제 등 문화행사를 한눈에 보고, 날씨 정보를 함께 확인할 수 있는 서비스입니다.
FastAPI + Next.js 스택으로 구축되었으며 Docker Compose 기반으로 손쉽게 배포할 수 있습니다.

[Seoul Now 바로가기](https://seoul-now.co.kr/)
---

## 🚀 주요 기능
- **행사 데이터 통합**: 서울 열린데이터광장 API(OA-15486)의 전체 필드를 수집·적재하여 행사의 상세 정보 제공
- **날씨 정보 연동**: 기상청 단기예보 API와 연동해 행사 날짜별 기온/강수확률/미세먼지 정보를 함께 제공
- **검색 및 필터**: 날짜, 자치구, 무료/유료, 카테고리, 텍스트 검색
- **지도 시각화**: Leaflet 기반 지도에 자치구별 행사 수 표시, 클릭 시 해당 구역 행사 필터 적용
- **맞춤 행사 카드**: 행사 페이지에서 요금·날씨 요약과 외부 링크 제공

---

## 🧱 프로젝트 구조
```
SeoulNow/
├── backend/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── api/                 # 라우터 (events, weather, user_actions 등)
│   │   ├── core/                # 설정/환경 변수 로딩
│   │   ├── db/                  # 세션/모델 정의
│   │   ├── schemas/             # Pydantic 스키마
│   │   └── services/            # 외부 연동, 비즈니스 로직
│   ├── alembic/                 # DB 마이그레이션 (versions 포함)
│   ├── alembic.ini              # Alembic 설정
│   ├── Dockerfile               # 백엔드 이미지 빌드
│   └── requirements.txt         # Python 의존성
│
├── frontend/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                 # App Router 페이지/스타일
│   │   ├── components/          # 재사용 UI, 지도 컴포넌트 등
│   │   └── lib/                 # API 클라이언트, 유틸 함수
│   ├── public/                  # 정적 파일
│   ├── Dockerfile               # 프런트엔드 이미지 빌드
│   ├── package.json             # Node 의존성
│   └── package-lock.json
│
├── docker-compose.yml           # 프런트·백엔드·PostgreSQL 통합 실행
├── README.md                    # 프로젝트 설명 (현재 문서)
└── 기타 설정 및 문서
```

---

## ⚙️ 실행 방법
### 1. 로컬 개발 (Docker Compose 권장)
```bash
git clone https://github.com/MyeoGyun/SeoulNow.git
cd SeoulNow

# 환경 변수 적용
tcp backend/.env.example backend/.env  # 실제 API 키와 DB URL로 수정

docker compose up --build
```
- 백엔드 Swagger: http://localhost:8000/docs
- 프런트엔드: http://localhost:3000

### 2. 데이터베이스 마이그레이션
```bash
docker compose exec backend alembic upgrade head
```

### 3. 행사 데이터 동기화
```bash
docker compose exec backend curl -X POST http://localhost:8000/api/events/sync
```

---

## 🛠 기술 스택
| 영역 | 사용 기술 |
|------|-----------|
| Frontend | Next.js 13(App Router), TypeScript, Tailwind, Leaflet |
| Backend | FastAPI, SQLAlchemy, Alembic |
| DataBase | PostgreSQL |
| Infra | Docker Compose, Nginx, AWS EC2 |
| OPEN API | 서울 열린데이터 API, 기상청 단기예보 API |

---

## 🌍 배포 구조
1. **AWS EC2**: Docker Compose로 프런트·백엔드·DB 컨테이너 실행
2. **Elastic IP + 도메인**: `seoul-now.co.kr`, `www.seoul-now.co.kr`
3. **Nginx Reverse Proxy**: 80/443 → 프런트(3000), `/api` → 백엔드(8000)
4. **Certbot**: 무료 SSL 인증서 발급 및 자동 갱신

향후 확장 시 ALB + ACM, RDS, CloudFront/S3 등을 이용해 무중단/고가용 구성으로 전환할 수 있습니다.

### CI/CD (GitHub Actions → EC2)
- `main` 브랜치에 푸시되면 `.github/workflows/deploy-ec2.yml`이 실행되어 EC2 인스턴스로 SSH 배포를 수행합니다.
- 배포 스크립트와 상세 안내는 [`deploy/README.md`](deploy/README.md)를 참고하세요.
- 필요한 GitHub Secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_DEPLOY_PATH` (옵션: `EC2_SSH_PORT`, `EC2_COMPOSE_FILE`).

---

## 📌 향후 확장 아이디어
- 사용자 로그인/즐겨찾기 기능
- UserAction 로그를 활용한 인기 행사 및 개인화 추천
- PostGIS를 이용한 반경·좌표 기반 검색
- GitHub Actions 등 CI/CD 파이프라인 구축

---

## 👥 문의
- 기획/개발: DingGyun (guess_nana@naver.com)
- 버그 또는 기능 요청: GitHub Issues 활용

서울의 다양한 문화를 더 쉽게 만나볼 수 있도록 **Seoul Now**는 계속 발전할 예정입니다. 😊
