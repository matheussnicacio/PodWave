#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 11: seguir pessoas, seguidores/seguindo
# e feed de quem eu sigo.
# Uso (a partir de podwaveapi/):
#   API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
#   DB="mariadb -uroot podwave" bash "../podwavefrontend/01 - Docs/atividade11/testes-curl-atividade11.sh"
# Requer: bash, curl e node (sem Python). Cria três contas (A, B e C) com sufixo aleatório, então pode rodar várias vezes.
# O bloco 07 precisa de um cliente de banco (variável DB).
API="${API:-http://localhost:4000/api}"
AUDIO="${AUDIO:-./audio-teste.mp3}"
CAPA="${CAPA:-./capa-teste.jpg}"
DB="${DB:-mariadb -uroot podwave}"
S="$(date +%s)$RANDOM"
PASS="senha123"

# j: lê o JSON da entrada padrão em `d` e imprime o resultado da expressão JS.
# Usa Node (já instalado, pois a API roda nele) em vez de Python: assim o script
# funciona no Git Bash do Windows sem nenhuma instalação extra.
j() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const r=eval(process.argv[1]); console.log(typeof r==='object'?JSON.stringify(r):r)" "$1"; }
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
uid() { curl -s "$API/profile/$1$S" | j "d['data']['id']"; }
# Mostra só o essencial dos contadores e de isFollowing/isOwner de um perfil.
prof() { # prof <username> [token]
  local h=(); [ -n "$2" ] && h=(-H "Authorization: Bearer $2")
  curl -s "${h[@]}" "$API/profile/$1" | j "(({username,followersCount,followingCount,isFollowing,isOwner})=>({username,followersCount,followingCount,isFollowing,isOwner}))(d.data)"
}

echo "== 00. Preparação: contas A, B e C; B publica 1 episódio (A e C não publicam)"
reg a; reg b; reg c
TA=$(login a); TB=$(login b); TC=$(login c)
UA=$(uid a); UB=$(uid b); UC=$(uid c)
echo "ids: A=$UA B=$UB C=$UC"
# Quem publica é B: o feed de A (que segue B) precisa ter exatamente 1 item.
EP=$(curl -s -X POST "$API/episodes" -H "Authorization: Bearer $TB" \
  -F "title=Episodio do B $S" -F "description=desc" -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d['data']['id']")
echo "episódio do B id=$EP"

echo; echo "== 01. Validações: sem token 401 ; id 'abc' 400 ; seguir a si mesmo 400 ; usuário 99999 404"
req POST "/users/$UB/toggle-follow"
req POST "/users/abc/toggle-follow" "$TA"
req POST "/users/$UA/toggle-follow" "$TA"
req POST "/users/99999/toggle-follow" "$TA"

echo; echo "== 02. Toggle: A segue B 201/1 ; A de novo 200/0 ; de novo 201/1 ; C segue B 2 ; B segue A"
req POST "/users/$UB/toggle-follow" "$TA"
req POST "/users/$UB/toggle-follow" "$TA"
req POST "/users/$UB/toggle-follow" "$TA"
req POST "/users/$UB/toggle-follow" "$TC"
req POST "/users/$UA/toggle-follow" "$TB"

echo; echo "== 03. Contadores dos dois lados: B 2 seguidores/1 seguindo ; A 1/1 ; C 0/1"
prof "b$S"; prof "a$S"; prof "c$S"

echo; echo "== 04. follow-status e isFollowing: visitante false ; A vendo B true ; C vendo A false ; B vendo B false (isOwner true)"
echo "-- follow-status sem token (401):"; req GET "/users/$UB/follow-status"
echo "-- follow-status A->B:"; req GET "/users/$UB/follow-status" "$TA"
echo "-- follow-status C->A:"; req GET "/users/$UA/follow-status" "$TC"
echo "-- perfil de B como visitante:"; prof "b$S"
echo "-- perfil de B visto por A:";    prof "b$S" "$TA"
echo "-- perfil de A visto por C:";    prof "a$S" "$TC"
echo "-- perfil de B visto pelo próprio B:"; prof "b$S" "$TB"

echo; echo "== 05. Listas públicas: followers de B (A e C; mais recente primeiro) ; following de A (B) ; sem password ; inexistente 404"
echo "-- followers de B (sem token):"; req GET "/users/$UB/followers"
echo "-- following de A (sem token):"; req GET "/users/$UA/following"
echo "-- password em algum item? (esperado: False)"
curl -s "$API/users/$UB/followers" | node -e "console.log(require('fs').readFileSync(0,'utf8').includes('password'))"
echo "-- usuário inexistente:"; req GET "/users/99999/followers"; req GET "/users/99999/following"
echo "-- id inválido:"; req GET "/users/abc/followers"

echo; echo "== 06. Feed filtrado: sem token 401 ; A (segue B) só itens de B ; ?page=2&limit=1 -> [] ; quem não segue ninguém -> []"
req GET "/following-episodes"
echo "-- A:"; curl -s "$API/following-episodes" -H "Authorization: Bearer $TA" | j "d.data.map(i=>[i.id,i.title,i.author.username])"
echo "-- A, page=2&limit=1:"; req GET "/following-episodes?page=2&limit=1" "$TA"
echo "-- conta nova que não segue ninguém:"
reg d; TD=$(login d); req GET "/following-episodes" "$TD"
echo "-- A deixa de seguir B -> o item some do feed:"
req POST "/users/$UB/toggle-follow" "$TA"
curl -s "$API/following-episodes" -H "Authorization: Bearer $TA" | j "d['data']"
req POST "/users/$UB/toggle-follow" "$TA" >/dev/null   # volta a seguir, para o bloco 07

echo; echo "== 07. Índice único: inserir linha repetida à mão no banco -> recusada"
$DB -e "INSERT INTO follows (follower_id, following_id, created_at, updated_at) VALUES ($UA, $UB, NOW(), NOW());" 2>&1
$DB -e "SHOW INDEX FROM follows;"
$DB -e "SELECT follower_id, following_id FROM follows WHERE follower_id IN ($UA,$UB,$UC);"

echo; echo "== 08. Concorrência: 8 cliques simultâneos do mesmo par -> contadores nunca negativos e iguais às linhas"
for i in 1 2 3 4 5 6 7 8; do curl -s -o /dev/null -X POST "$API/users/$UC/toggle-follow" -H "Authorization: Bearer $TA" & done; wait
$DB -e "SELECT (SELECT COUNT(*) FROM follows WHERE following_id=$UC) linhas_seguidores_C, (SELECT followers_count FROM users WHERE id=$UC) followers_count_C, (SELECT COUNT(*) FROM follows WHERE follower_id=$UA) linhas_seguindo_A, (SELECT following_count FROM users WHERE id=$UA) following_count_A;"

echo; echo "== 09. Regressão: curtir, comentar e GET /feed continuam funcionando"
req POST "/episodes/$EP/toggle-like" "$TA"
req POST "/episodes/$EP/comments" "$TA" '{"content":"regressão ok"}'
curl -s "$API/feed?page=1&limit=3" -H "Authorization: Bearer $TA" | j "'itens no feed geral: '+d.data.length"
