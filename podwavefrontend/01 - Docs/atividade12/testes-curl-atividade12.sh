#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 12 (Checkpoint 2): paginação, transação
# do episódio + contador, ids inválidos e regressão das Aulas 01–11.
# Uso (a partir de podwaveapi/):
#   API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
#   bash "../podwavefrontend/01 - Docs/atividade12/testes-curl-atividade12.sh"
# Requer: bash, curl e node. Cria 3 contas (A, B, C) com sufixo aleatório.
API="${API:-http://localhost:4000/api}"
AUDIO="${AUDIO:-./audio-teste.mp3}"
CAPA="${CAPA:-./capa-teste.jpg}"
S="$(date +%s)$RANDOM"
PASS="senha123"

j() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const r=eval(process.argv[1]); console.log(typeof r==='object'?JSON.stringify(r):r)" "$1"; }
req() { # req <método> <url> [token] [json]
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -w '\n[HTTP %{http_code}]\n' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}" | cut -c1-400
}
reg() { curl -s -o /dev/null -X POST "$API/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1$S\",\"email\":\"$1$S@t.com\",\"password\":\"$PASS\",\"confirmPassword\":\"$PASS\",\"fullName\":\"Usuario $1\"}"; }
login() { curl -s -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1$S@t.com\",\"password\":\"$PASS\"}" | j "d.data.token"; }
uid() { curl -s "$API/profile/$1$S" | j "d.data.id"; }
publish() { # publish <token> <titulo> -> imprime "HTTP id"
  curl -s -X POST "$API/episodes" -H "Authorization: Bearer $1" -F "title=$2" -F "description=desc" \
    -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" -w '\n%{http_code}' | node -e "const t=require('fs').readFileSync(0,'utf8').trim().split('\n');const c=t.pop();let id='-';try{id=JSON.parse(t.join('\n')).data.id}catch{};console.log(c+' id='+id)"; }
count() { j "d.data.length"; }

echo "== 00. Preparação: contas A, B, C"
reg a; reg b; reg c
TA=$(login a); TB=$(login b); TC=$(login c)
UA=$(uid a); UB=$(uid b); UC=$(uid c)
echo "ids: A=$UA B=$UB C=$UC"

echo; echo "== 01. Transação: contador do autor ANTES, publicar 14 episódios, contador DEPOIS (B)"
echo -n "episodesCount antes: "; curl -s "$API/profile/b$S" | j "d.data.episodesCount"
for i in $(seq 1 14); do R=$(publish "$TB" "Episodio $i do B"); [ $i -eq 1 ] && echo "primeiro: $R (esperado 201)"; done
echo -n "episodesCount depois (esperado 14): "; curl -s "$API/profile/b$S" | j "d.data.episodesCount"
EP=$(curl -s "$API/profile/b$S" | j "d.data.episodes[0].id")

echo; echo "== 02. A segue B (para o feed filtrado ter 14 itens)"
req POST "/users/$UB/toggle-follow" "$TA"

echo; echo "== 03. Paginação /feed: itens devolvidos por consulta"
for q in "" "limit=-3" "limit=0" "limit=abc" "limit=100000" "page=-2&limit=2" "page=abc" "limit=1" "limit=50" "limit=51"; do
  echo -n "GET /feed?$q -> "; curl -s -w ' [HTTP %{http_code}]' "$API/feed?$q" -H "Authorization: Bearer $TA" | node -e "const t=require('fs').readFileSync(0,'utf8');const m=t.match(/\[HTTP (\d+)\]\$/);const b=JSON.parse(t.replace(/ \[HTTP \d+\]\$/,''));console.log((b.data?b.data.length+' itens':'ERRO: '+b.message)+' [HTTP '+m[1]+']')"
done
echo "-- page=2&limit=1 deve ser o SEGUNDO mais novo (1 item), não a lista padrão:"
curl -s "$API/feed?page=2&limit=1" -H "Authorization: Bearer $TA" | j "d.data.map(i=>i.title)"
echo "-- page=1&limit=3 / page=2&limit=3 (sem repetir item):"
curl -s "$API/feed?page=1&limit=3" -H "Authorization: Bearer $TA" | j "d.data.map(i=>i.id)"
curl -s "$API/feed?page=2&limit=3" -H "Authorization: Bearer $TA" | j "d.data.map(i=>i.id)"
echo "-- sem token (401):"; req GET "/feed?limit=-3"

echo; echo "== 04. Paginação /following-episodes (A segue B, 14 itens)"
for q in "" "limit=-3" "limit=100000" "page=-2&limit=2" "page=2&limit=1"; do
  echo -n "GET /following-episodes?$q -> "; curl -s "$API/following-episodes?$q" -H "Authorization: Bearer $TA" | j "d.data.length+' itens'"
done
echo -n "conta C (não segue ninguém) -> "; curl -s "$API/following-episodes?limit=-3" -H "Authorization: Bearer $TC" | j "JSON.stringify(d.data)"
echo "-- sem token (401):"; req GET "/following-episodes"

echo; echo "== 05. Ids inválidos (os três curl do Bloco 2.5): mesmo status?"
echo "-- GET /episodes/abc:";                 req GET  "/episodes/abc"
echo "-- POST /episodes/abc/toggle-like:";    req POST "/episodes/abc/toggle-like" "$TA"
echo "-- GET /episodes/abc/comments:";        req GET  "/episodes/abc/comments"
echo "-- POST /users/abc/toggle-follow (módulo follow):"; req POST "/users/abc/toggle-follow" "$TA"
echo "-- GET /profile/usuario-que-nao-existe:"; req GET "/profile/nao-existe-$S"

echo; echo "== 06. Regressão — perfil com isFollowing (visitante / A vendo B / B vendo B)"
for who in "" "$TA" "$TB"; do
  H=(); [ -n "$who" ] && H=(-H "Authorization: Bearer $who")
  curl -s "${H[@]}" "$API/profile/b$S" | j "(({username,followersCount,episodesCount,isFollowing,isOwner})=>({username,followersCount,episodesCount,isFollowing,isOwner}))(d.data)"
done
echo "-- profile/me sem token (401) e com token:"; req GET "/profile/me"; curl -s "$API/profile/me" -H "Authorization: Bearer $TA" | j "d.data.username"

echo; echo "== 07. Regressão — seguir, seguidores e seguindo"
req POST "/users/$UB/toggle-follow" "$TC"
echo -n "followers de B (A e C): "; curl -s "$API/users/$UB/followers" | j "d.data.map(u=>u.username)"
echo -n "following de A: ";        curl -s "$API/users/$UA/following" | j "d.data.map(u=>u.username)"
echo -n "password vazou? (esperado false): "; curl -s "$API/users/$UB/followers" | node -e "console.log(require('fs').readFileSync(0,'utf8').includes('password'))"

echo; echo "== 08. Regressão — curtir, curtidas, comentar, comentários"
req POST "/episodes/$EP/toggle-like" "$TA"
echo -n "curtidos de A: "; curl -s "$API/liked-episodes" -H "Authorization: Bearer $TA" | j "d.data.map(e=>e.id)"
req POST "/episodes/$EP/comments" "$TA" '{"content":"regressão ok"}'
echo -n "comentários do episódio: "; curl -s "$API/episodes/$EP/comments" | j "d.data.map(c=>c.content)"
echo -n "detalhe (likesCount/commentsCount/isLiked): "; curl -s "$API/episodes/$EP" -H "Authorization: Bearer $TA" | j "(({likesCount,commentsCount,isLiked,isOwner})=>({likesCount,commentsCount,isLiked,isOwner}))(d.data)"

echo; echo "== 09. Regressão — meus itens, editar e excluir (contador volta a 13)"
echo -n "meus episódios de B: "; curl -s "$API/my-episodes" -H "Authorization: Bearer $TB" | j "d.data.length"
req PUT "/episodes/$EP" "$TB"
req DELETE "/episodes/$EP" "$TB"
echo -n "episodesCount de B depois de excluir (esperado 13): "; curl -s "$API/profile/b$S" | j "d.data.episodesCount"
echo "-- excluir de novo (404) e excluir de outro usuário (403 se existir):"
req DELETE "/episodes/$EP" "$TB"
EP2=$(curl -s "$API/profile/b$S" | j "d.data.episodes[0].id"); req DELETE "/episodes/$EP2" "$TA"
