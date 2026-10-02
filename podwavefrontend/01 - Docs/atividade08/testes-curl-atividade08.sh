#!/bin/bash
# ==============================================================================
# Testes de curl - Atividade 08 (PodWave) - PARTE A, Etapa 5
# ==============================================================================
# Rode de DENTRO da pasta podwaveapi, com a API no ar (npm run dev).
#
#   EMAIL=voce@email.com SENHA=suasenha ID=1 bash testes-curl-atividade08.sh
#
# EMAIL/SENHA: usuário DONO do episódio ID (o que fez o upload na Atividade 07).
# O script faz o login sozinho e usa o token devolvido (nada de token colado
# no arquivo). Tire um print de cada bloco (todos numerados e separados).
# ==============================================================================

BASE_URL="${BASE_URL:-http://localhost:4000}"
ID="${ID:-1}"
EMAIL="${EMAIL:?Defina EMAIL=...}"
SENHA="${SENHA:?Defina SENHA=...}"

sep() { echo ""; echo "=============================================================="; echo "$1"; echo "=============================================================="; }

sep "0) LOGIN -- POST /api/login (pega o token do dono)"
TOKEN=$(curl -s -X POST "$BASE_URL/api/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "token: ${TOKEN:0:25}..."

sep "1) DETALHE sem token -> 200, isOwner:false, views +1"
curl -s -w "\n[HTTP %{http_code}]\n" "$BASE_URL/api/episodes/$ID"

sep "2) DETALHE com token do dono -> 200, isOwner:true, views +1"
curl -s -w "\n[HTTP %{http_code}]\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/episodes/$ID"

sep "3) DETALHE de episódio inexistente -> 404"
curl -s -w "\n[HTTP %{http_code}]\n" "$BASE_URL/api/episodes/999999"

sep "4) STREAM sem token -> 401"
curl -s -w "\n[HTTP %{http_code}]\n" "$BASE_URL/api/episodes/$ID/stream" -o /dev/null

sep "5) STREAM com token -> 200"
curl -s -o /dev/null -w "[HTTP %{http_code}] %{size_download} bytes\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/episodes/$ID/stream"

sep "6) MESMO ARQUIVO via /uploads, SEM token -> 200 (a inconsistência)"
AUDIO=$(curl -s "$BASE_URL/api/episodes/$ID" | sed -n 's/.*"audio":"\([^"]*\)".*/\1/p')
curl -s -o /dev/null -w "[HTTP %{http_code}] %{size_download} bytes  (/uploads/episodes/audio/$AUDIO)\n" "$BASE_URL/uploads/episodes/audio/$AUDIO"

sep "7) STREAM com Range: bytes=0-1023 -> 206 + Content-Range"
curl -s -D - -o /dev/null -H "Authorization: Bearer $TOKEN" -H "Range: bytes=0-1023" "$BASE_URL/api/episodes/$ID/stream" | grep -iE "^HTTP|content-range|content-length|content-type|accept-ranges"

sep "8) FEED sem token -> 401"
curl -s -w "\n[HTTP %{http_code}]\n" "$BASE_URL/api/feed"

sep "9) FEED ?page=1&limit=1 -> um item só"
curl -s -w "\n[HTTP %{http_code}]\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/feed?page=1&limit=1"

sep "10) FEED ?page=2&limit=1 -> próximo item, ou [] se só houver um"
curl -s -w "\n[HTTP %{http_code}]\n" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/feed?page=2&limit=1"
