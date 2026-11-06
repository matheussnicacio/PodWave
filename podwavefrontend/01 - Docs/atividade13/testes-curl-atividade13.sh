#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 13: playlists (muitos-para-muitos),
# "Salvar" idempotente, busca de verdade e exclusão do episódio limpando as
# playlists. Segue a ordem do Bloco 11 do roteiro (Etapa 6 do enunciado).
# Uso (a partir de podwaveapi/):
#   API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
#   bash "../podwavefrontend/01 - Docs/atividade13/testes-curl-atividade13.sh"
# Requer: bash, curl e node. Cria 2 contas (A e B) com sufixo aleatório.
# O teste 10 (linha repetida na junção) é feito no cliente de banco: o script
# só imprime o INSERT a usar.
API="${API:-http://localhost:4000/api}"
AUDIO="${AUDIO:-./audio-teste.mp3}"
CAPA="${CAPA:-./capa-teste.jpg}"
S="$(date +%s)$RANDOM"
PASS="senha123"

j() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const r=eval(process.argv[1]); console.log(typeof r==='object'?JSON.stringify(r):r)" "$1"; }
req() { # req <método> <url> [token] [json]
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -w '\n[HTTP %{http_code}]\n' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}" | cut -c1-500
}
body() { # igual a req, mas só o corpo (para extrair campos com j)
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
reg() { curl -s -o /dev/null -X POST "$API/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1$S\",\"email\":\"$1$S@t.com\",\"password\":\"$PASS\",\"confirmPassword\":\"$PASS\",\"fullName\":\"Usuario $1\"}"; }
login() { curl -s -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1$S@t.com\",\"password\":\"$PASS\"}" | j "d.data.token"; }
publish() { # publish <token> <titulo> -> imprime o id
  curl -s -X POST "$API/episodes" -H "Authorization: Bearer $1" -F "title=$2" -F "description=desc" \
    -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d.data.id"; }
mkpl() { body POST /playlists "$1" "$2" | j "d.data.id"; }
plcount() { body GET /my-playlists "$1" | j "(d.data.find(p=>p.id==$2)||{}).episodesCount"; }

echo "== 00. Preparação: contas A e B, um episódio de cada"
reg a; reg b
TA=$(login a); TB=$(login b)
EA=$(publish "$TA" "Zebra Kappa $S episodio da A")
EB=$(publish "$TB" "Episodio do B $S")
echo "episódios: EA=$EA EB=$EB"

echo; echo "== 01. Criar"
echo "-- sem token (401)";               req POST /playlists "" '{"title":"Minha"}'
echo "-- título 'ab' (400)";             req POST /playlists "$TA" '{"title":"ab"}'
echo "-- só espaços (400)";              req POST /playlists "$TA" '{"title":"     "}'
echo "-- isPublic \"sim\" (400)";        req POST /playlists "$TA" '{"title":"Valida","isPublic":"sim"}'
echo "-- sucesso SEM isPublic (201, isPublic:false, título sem espaços nas pontas)"
req POST /playlists "$TA" '{"title":"   Privada da A   "}'
echo "-- sucesso COM isPublic:true (201)"
req POST /playlists "$TA" '{"title":"Publica da A","description":"lista aberta","isPublic":true}'

echo; echo "== 02. Listar as minhas (a mais nova primeiro; duas criadas em < 1 s)"
P1=$(mkpl "$TA" '{"title":"Desempate 1"}'); P2=$(mkpl "$TA" '{"title":"Desempate 2"}')
echo "criadas: $P1 e depois $P2 — esperado ver $P2 antes de $P1"
body GET /my-playlists "$TA" | j "d.data.map(p=>p.id+':'+p.title).join(' | ')"
echo -n "B só vê as dele (esperado 0): "; body GET /my-playlists "$TB" | j "d.data.length"

PRIV=$(body GET /my-playlists "$TA" | j "d.data.find(p=>p.title==='Privada da A').id")
PUB=$(body GET /my-playlists "$TA" | j "d.data.find(p=>p.title==='Publica da A').id")
PLB=$(mkpl "$TB" '{"title":"Playlist do B"}')
echo "privada da A=$PRIV  pública da A=$PUB  playlist do B=$PLB"

echo; echo "== 03. Adicionar"
echo "-- primeira vez (201, added:true, episodesCount:1)"; req POST /playlists/$PUB/episodes "$TA" "{\"episodeId\":$EB}"
echo "-- repetir (200, added:false, ainda 1)";             req POST /playlists/$PUB/episodes "$TA" "{\"episodeId\":$EB}"
echo "-- episódio inexistente (404)";                      req POST /playlists/$PUB/episodes "$TA" '{"episodeId":99999}'
echo "-- corpo sem episodeId (400)";                       req POST /playlists/$PUB/episodes "$TA" '{}'
echo "-- episodeId \"abc\" (400)";                         req POST /playlists/$PUB/episodes "$TA" '{"episodeId":"abc"}'
echo "-- playlist de outra pessoa (403)";                  req POST /playlists/$PLB/episodes "$TA" "{\"episodeId\":$EB}"
echo "-- playlist 99999 (404)";                            req POST /playlists/99999/episodes "$TA" "{\"episodeId\":$EB}"
echo "-- id abc na URL (400)";                             req POST /playlists/abc/episodes "$TA" "{\"episodeId\":$EB}"

echo; echo "== 04. Remover"
req POST /playlists/$PRIV/episodes "$TA" "{\"episodeId\":$EA}" > /dev/null
echo -n "contador da privada antes: "; plcount "$TA" "$PRIV"
echo "-- remover (200, contador desce)";      req DELETE /playlists/$PRIV/episodes/$EA "$TA"
echo "-- repetir (404)";                      req DELETE /playlists/$PRIV/episodes/$EA "$TA"
echo "-- playlist de outra pessoa (403)";     req DELETE /playlists/$PLB/episodes/$EA "$TA"
req POST /playlists/$PRIV/episodes "$TA" "{\"episodeId\":$EA}" > /dev/null

echo; echo "== 05. Ler"
echo "-- pública, visitante (200, isOwner:false, com owner e author, sem password)"
R=$(body GET /playlists/$PUB); echo "$R" | j "({isOwner:d.data.isOwner, owner:d.data.owner, episodes:d.data.episodes.map(e=>({id:e.id,title:e.title,author:e.author}))})"
echo -n "contém 'password'? "; echo "$R" | grep -c password
echo "-- privada, visitante (403)";      req GET /playlists/$PRIV
echo "-- privada, outra conta (403)";    req GET /playlists/$PRIV "$TB"
echo -n "-- privada, a dona (esperado 200 e isOwner:true): "; body GET /playlists/$PRIV "$TA" | j "'isOwner='+d.data.isOwner+' episodes='+d.data.episodes.length"
echo "-- 99999 (404)";                   req GET /playlists/99999
echo "-- abc (400)";                     req GET /playlists/abc

echo; echo "== 06. Status"
echo "-- sem token (401)"; req GET /episodes/$EA/playlists-status
echo "-- A, episódio EA (hasEpisode true só na privada)"
body GET /episodes/$EA/playlists-status "$TA" | j "d.data.map(p=>p.title+':'+p.hasEpisode).join(' | ')"
echo "-- episódio inexistente (404)"; req GET /episodes/99999/playlists-status "$TA"
echo "-- B vê as playlists DELE"; body GET /episodes/$EA/playlists-status "$TB" | j "d.data.map(p=>p.title+':'+p.hasEpisode).join(' | ')"

echo; echo "== 07. Excluir a playlist"
TMP=$(mkpl "$TA" '{"title":"Para excluir"}')
req POST /playlists/$TMP/episodes "$TA" "{\"episodeId\":$EB}" > /dev/null
echo "-- B tenta excluir (403)";  req DELETE /playlists/$TMP "$TB"
echo "-- A exclui (200)";         req DELETE /playlists/$TMP "$TA"
echo "-- depois (404)";           req GET /playlists/$TMP "$TA"
echo -n "-- o episódio EB continua existindo (esperado 200): "; curl -s -o /dev/null -w '%{http_code}\n' "$API/episodes/$EB"
echo "   (no banco: SELECT * FROM playlist_episodes WHERE playlist_id = $TMP; -> nenhuma linha)"

echo; echo "== 08. Excluir um episódio que está em playlists de DUAS pessoas"
EX=$(publish "$TA" "Episodio descartavel $S")
req POST /playlists/$P1/episodes "$TA" "{\"episodeId\":$EX}" > /dev/null
req POST /playlists/$PLB/episodes "$TB" "{\"episodeId\":$EX}" > /dev/null
echo "antes: A/P1=$(plcount "$TA" "$P1")  B=$(plcount "$TB" "$PLB")  (esperado 1 e 1)"
curl -s -o /dev/null -X DELETE "$API/episodes/$EX" -H "Authorization: Bearer $TA"
echo "depois: A/P1=$(plcount "$TA" "$P1")  B=$(plcount "$TB" "$PLB")  (esperado 0 e 0)"

echo; echo "== 09. Busca"
s() { echo -n "$1 -> "; curl -s -g "$API/search$1" | j "'query='+JSON.stringify(d.data.query)+' podcasts='+d.data.podcasts.length+' users='+d.data.users.length"; }
s ""; s "?q="; s "?q=%20%20%20"; s "?q=z"
echo -n "trecho do título, outra caixa (?q=zEBRA%20kap) -> "; curl -s -g "$API/search?q=zEBRA%20kap" | j "d.data.podcasts.map(e=>e.title+' / autor='+e.author.username).join(' | ')"
echo -n "trecho do username (?q=a$S) -> "; R=$(curl -s -g "$API/search?q=a$S"); echo "$R" | j "d.data.users.map(u=>u.username).join(',')"
echo -n "   contém 'password'? "; echo "$R" | grep -c password
s "?q=naoexiste$S"
s "?q=ab&q=cd"; s "?q[x]=1"; s "?q=%25%25"; s "?q=__"

echo; echo "== 10. No cliente de banco (deve ser recusado com Duplicate entry ... idx_unique_playlist_episode):"
echo "   INSERT INTO playlist_episodes (playlist_id, episode_id, created_at, updated_at) VALUES ($PUB, $EB, NOW(), NOW());"

echo; echo "== 11. Regressão"
echo -n "feed: ";            curl -s -o /dev/null -w '%{http_code}\n' "$API/feed" -H "Authorization: Bearer $TA"
echo -n "detalhe: ";         curl -s -o /dev/null -w '%{http_code}\n' "$API/episodes/$EB"
echo -n "perfil: ";          curl -s -o /dev/null -w '%{http_code}\n' "$API/profile/a$S"
echo -n "curtir: ";          curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/episodes/$EB/toggle-like" -H "Authorization: Bearer $TA"
echo -n "comentar: ";        curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/episodes/$EB/comments" -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' -d '{"content":"bom"}'
UB=$(curl -s "$API/profile/b$S" | j "d.data.id")
echo -n "seguir: ";          curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/users/$UB/toggle-follow" -H "Authorization: Bearer $TA"
echo -n "seguidores: ";      curl -s -o /dev/null -w '%{http_code}\n' "$API/users/$UB/followers"
echo -n "seguindo: ";        curl -s -o /dev/null -w '%{http_code}\n' "$API/users/$UB/following"
echo -n "feed seguindo: ";   curl -s -o /dev/null -w '%{http_code}\n' "$API/following-episodes" -H "Authorization: Bearer $TA"
echo -n "upload: ";          [ -n "$(publish "$TA" "Regressao $S")" ] && echo ok
echo -n "edição: ";          curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$API/episodes/$EA" -H "Authorization: Bearer $TA" -F "title=Zebra Kappa editado"
echo "users/abc/followers (400, mesma mensagem):"; req GET /users/abc/followers
