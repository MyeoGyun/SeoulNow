# EC2 Docker Compose 배포 파이프라인

이 문서는 GitHub Actions → EC2 인스턴스로 자동 배포되는 흐름을 설명합니다. 프런트/백엔드 컨테이너는 동일한 `docker-compose.yml`을 사용해 서버에서 빌드/실행합니다.

## 1. EC2 환경 준비

1. **Docker & Compose 설치**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   ```
   이후 재로그인 해 `docker version`으로 확인합니다.

2. **프로젝트 체크아웃**
   ```bash
   cd /home/ubuntu
   git clone https://github.com/<YOUR_ORG>/SeoulNow.git
   ```

3. **환경변수 준비**
   - `backend/.env`, `frontend/.env.local` 등 민감한 파일은 서버에 수동으로 배치합니다.
   - `CORS_ORIGINS`, DB 정보는 `.env` 또는 ECS Parameter Store 등에서 관리합니다.

4. **초기 실행 테스트**
   ```bash
   docker compose up -d --build
   ```
   브라우저에서 서비스가 정상 기동하는지 확인합니다.

## 2. GitHub Secrets 구성

| Secret 키            | 설명                                                                    |
|---------------------|-------------------------------------------------------------------------|
| `EC2_HOST`          | EC2 퍼블릭 IP 또는 도메인                                              |
| `EC2_USER`          | SSH 사용자 (`ubuntu` 등)                                               |
| `EC2_SSH_KEY`       | GitHub Actions에서 사용할 개인키 (base64 인코딩 필요 없음)             |
| `EC2_DEPLOY_PATH`   | 서버에서 프로젝트가 존재하는 경로 (예: `/home/ubuntu/SeoulNow`)        |
| `EC2_SSH_PORT`      | (옵션) SSH 포트. 미설정 시 22 사용                                      |
| `EC2_COMPOSE_FILE`  | (옵션) 기본 `docker-compose.yml`이 아닌 다른 파일을 쓰고 싶을 때 경로 |

> SSH 키는 `-----BEGIN OPENSSH PRIVATE KEY-----` 형식으로 저장하세요. 권한 문제를 피하려면 배포 전 `chmod 600 ~/.ssh/<key>` 적용.

## 3. 워크플로우 동작

- `main` 브랜치에 푸시되면 `.github/workflows/deploy-ec2.yml`이 실행됩니다.
- 작업 순서
  1. 레포지토리를 체크아웃하고 `deploy/ec2-deploy.sh`를 아티팩트로 준비
  2. `rsync`로 EC2 임시 폴더에 스크립트 업로드
  3. SSH로 접속해 `deploy/ec2-deploy.sh` 실행
     - `git fetch`, `git reset --hard origin/<branch>`
     - `docker compose pull && build && up -d`
     - 사용하지 않는 이미지는 prune

## 4. 수동 롤백

문제가 생기면 서버에서 이전 브랜치/태그를 체크아웃한 뒤 스크립트를 재실행하면 됩니다.

```bash
cd /home/ubuntu/SeoulNow
git checkout <safe-tag>
./deploy/ec2-deploy.sh /home/ubuntu/SeoulNow
```

## 5. 팁

- `docker compose logs -f backend`로 백엔드 로그를 모니터링하세요.
- 정기적으로 `docker volume prune`을 실행해 디스크를 관리하세요.
- CloudWatch 또는 외부 모니터링(ELK, Grafana)을 붙여 상태를 추적하면 좋습니다.

