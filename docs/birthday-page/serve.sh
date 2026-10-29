#!/usr/bin/env bash
# 로컬에서 블로그를 띄워 생일 축하 페이지를 확인하는 스크립트.
#   PC:    http://localhost:4000/playground/kim-wanmyung-66th/
#   모바일: 같은 Wi-Fi 에서 http://<이 맥의 IP>:4000/playground/kim-wanmyung-66th/
#
# 사용법:
#   bash docs/birthday-page/serve.sh
#
# 종료는 Ctrl+C.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

CERT_DIR="/tmp/jekyll-certs"
mkdir -p "$CERT_DIR"
{
  security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain
  security find-certificate -a -p /Library/Keychains/System.keychain
} > "$CERT_DIR/ca.pem"

# 맥의 IP 뽑아서 안내 — 모바일에서 바로 접속하기 쉽게.
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '')"

echo ""
echo "=============================================="
echo " Jekyll serve 를 시작합니다."
echo "   PC:    http://localhost:4000/playground/kim-wanmyung-66th/"
if [ -n "$LAN_IP" ]; then
  echo "   모바일: http://$LAN_IP:4000/playground/kim-wanmyung-66th/"
  echo "          (맥과 폰이 같은 Wi-Fi 에 있어야 합니다)"
fi
echo " 종료: Ctrl+C"
echo "=============================================="
echo ""

docker run --rm -it \
  -v "$REPO_ROOT":/srv/jekyll \
  -v "$CERT_DIR":/certs:ro \
  -p 4000:4000 \
  -w /srv/jekyll \
  -e SSL_CERT_FILE=/certs/ca.pem \
  -e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
  -e JEKYLL_ENV=development \
  ruby:3.3 bash -c '
    bundle install --quiet
    bundle exec jekyll serve \
      --host 0.0.0.0 \
      --future \
      --unpublished \
      --livereload-port 35729
  '
