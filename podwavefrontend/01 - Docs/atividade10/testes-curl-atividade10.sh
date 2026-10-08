#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 10: curtidas e comentários.
# Uso (a partir de podwaveapi/):
#   API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
#   DB="mariadb -uroot podwave" bash "../podwavefrontend/01 - Docs/atividade10/testes-curl-atividade10.sh"
# Cria duas contas (A e B) com sufixo aleatório, então pode rodar várias vezes.
API="${API:-http://localhost:4000/api}"
AUDIO="${AUDIO:-./audio-teste.mp3}"
CAPA="${CAPA:-./capa-teste.jpg}"
DB="${DB:-mariadb -uroot podwave}"
S="$(date +%s)$RANDOM"
PASS="senha123"

j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
req() { # req <método> <url> [token] [json]
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -w '\n[HTTP %{http_code}]\n' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
reg() { curl -s -X POST "$API/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1$S\",\"email\":\"$1$S@t.com\",\"password\":\"$PASS\",\"confirmPassword\":\"$PASS\",\"fullName\":\"Usuario $1\"}" >/dev/null; }
login() { curl -s -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1$S@t.com\",\"password\":\"$PASS\"}" | j "d['data']['token']"; }

echo "== 00. Preparação: contas A e B, episódio da A"
reg a; reg b
TA=$(login a); TB=$(login b)
EP=$(curl -s -X POST "$API/episodes" -H "Authorization: Bearer $TA" \
  -F "title=Episodio teste $S" -F "description=desc" -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d['data']['id']")
echo "episódio id=$EP"

echo; echo "== 01. Curtir: sem token -> 401 ; inexistente -> 404"
req POST "/episodes/$EP/toggle-like"
req POST "/episodes/999999/toggle-like" "$TB"

echo; echo "== 02. Toggle: B curte 201/true/1 ; B de novo 200/false/0 ; de novo 201/1 ; A curte 2"
req POST "/episodes/$EP/toggle-like" "$TB"
req POST "/episodes/$EP/toggle-like" "$TB"
req POST "/episodes/$EP/toggle-like" "$TB"
req POST "/episodes/$EP/toggle-like" "$TA"

echo; echo "== 03. like-status (visitante e B) e isLiked no detalhe (visitante false, B true)"
req GET "/episodes/$EP/like-status"
req GET "/episodes/$EP/like-status" "$TB"
echo "-- detalhe visitante:"; curl -s "$API/episodes/$EP" | j "{k:d['data'][k] for k in ('isLiked','likesCount','commentsCount')}"
echo "-- detalhe B:";         curl -s "$API/episodes/$EP" -H "Authorization: Bearer $TB" | j "{k:d['data'][k] for k in ('isLiked','likesCount','commentsCount')}"

echo; echo "== 04. Índice único: inserir curtida repetida à mão no banco -> recusada"
UB=$(curl -s "$API/profile/b$S" | j "d['data']['id']")
$DB -e "INSERT INTO likes (user_id, episode_id, created_at, updated_at) VALUES ($UB, $EP, NOW(), NOW());" 2>&1
$DB -e "SELECT user_id, episode_id FROM likes WHERE episode_id=$EP;"

echo; echo "== 05. liked-episodes: B (com autor) ; sem token -> 401"
req GET "/liked-episodes" "$TB"
req GET "/liked-episodes"

echo; echo "== 06. Comentar: sem token 401 ; só espaços 400 ; 501 caracteres 400 ; inexistente 404 ; sucesso 201"
req POST "/episodes/$EP/comments" "" '{"content":"oi"}'
req POST "/episodes/$EP/comments" "$TB" '{"content":"     "}'
req POST "/episodes/$EP/comments" "$TB" "{\"content\":\"$(python3 -c 'print("x"*501)')\"}"
req POST "/episodes/999999/comments" "$TB" '{"content":"oi"}'
req POST "/episodes/$EP/comments" "$TB" '{"content":"   Primeiro comentário   "}'
req POST "/episodes/$EP/comments" "$TA" '{"content":"Segundo\ncom duas linhas"}'

echo; echo "== 07. Listar comentários sem token: 200, mais novos primeiro; contador = nº de itens"
req GET "/episodes/$EP/comments"
curl -s "$API/episodes/$EP" | j "('commentsCount =', d['data']['commentsCount'])"

echo; echo "== 08. Excluir episódio com curtidas e comentários (A): 200 e nada sobra no banco"
$DB -e "SELECT 'antes' q, (SELECT COUNT(*) FROM likes WHERE episode_id=$EP) likes, (SELECT COUNT(*) FROM comments WHERE episode_id=$EP) comments, (SELECT episodes_count FROM users WHERE username='a$S') episodes_count_A;"
ls public/uploads/episodes/audio | wc -l | sed 's/^/arquivos de áudio antes: /'
req DELETE "/episodes/$EP" "$TA"
$DB -e "SELECT 'depois' q, (SELECT COUNT(*) FROM likes WHERE episode_id=$EP) likes, (SELECT COUNT(*) FROM comments WHERE episode_id=$EP) comments, (SELECT episodes_count FROM users WHERE username='a$S') episodes_count_A;"
ls public/uploads/episodes/audio | wc -l | sed 's/^/arquivos de áudio depois: /'
req GET "/liked-episodes" "$TB"

echo; echo "== 09. Título só com espaços -> 400 (curl -F apara espaços; por isso Python)"
python3 - "$API" "$TA" "$AUDIO" "$CAPA" <<'PY'
import sys, uuid, urllib.request, json
api, tok, audio, capa = sys.argv[1:5]
b = uuid.uuid4().hex
def part(name, value=None, filename=None, ctype=None, data=None):
    h = f'--{b}\r\nContent-Disposition: form-data; name="{name}"'
    if filename: h += f'; filename="{filename}"'
    h += '\r\n'
    if ctype: h += f'Content-Type: {ctype}\r\n'
    h += '\r\n'
    return h.encode() + (data if data is not None else value.encode()) + b'\r\n'
body = part('title', '     ') + part('description', 'x') \
     + part('audio', filename='a.mp3', ctype='audio/mpeg', data=open(audio,'rb').read()) \
     + part('cover', filename='c.jpg', ctype='image/jpeg', data=open(capa,'rb').read()) \
     + f'--{b}--\r\n'.encode()
r = urllib.request.Request(api + '/episodes', data=body, method='POST',
    headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'multipart/form-data; boundary=' + b})
try:
    resp = urllib.request.urlopen(r); print(resp.status, resp.read().decode())
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode())
PY
echo "-- registro com username/nome só de espaços -> 400:"
curl -s -w '\n[HTTP %{http_code}]\n' -X POST "$API/register" -H 'Content-Type: application/json' \
  -d '{"username":"     ","email":"x@x.com","password":"123456","confirmPassword":"123456","fullName":"     "}'
