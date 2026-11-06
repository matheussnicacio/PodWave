#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 14: notificações (curtir, comentar,
# seguir), denúncias, exclusão do episódio limpando as duas tabelas e o cors
# antes dos parsers. Segue a ordem da Etapa 5 do enunciado (Bloco 11 do roteiro).
# Uso (a partir de podwaveapi/):
#   API=http://localhost:4000/api AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg \
#   bash "../podwavefrontend/01 - Docs/atividade14/testes-curl-atividade14.sh"
# Requer: bash, curl e node. Cria 3 contas (A, B, C) com sufixo aleatório.
# O teste 8 (linha repetida / motivo fora do ENUM) é feito no cliente de banco:
# o script só imprime os comandos.
API="${API:-http://localhost:4000/api}"
ORIGIN="${ORIGIN:-http://localhost:5173}"
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
body() {
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
code() { # code <método> <url> [token] [json] -> só o status
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -o /dev/null -w '%{http_code}' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
reg() { curl -s -o /dev/null -X POST "$API/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1$S\",\"email\":\"$1$S@t.com\",\"password\":\"$PASS\",\"confirmPassword\":\"$PASS\",\"fullName\":\"Usuario $1\"}"; }
login() { curl -s -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1$S@t.com\",\"password\":\"$PASS\"}" | j "d.data.token"; }
uid() { curl -s "$API/profile/$1$S" | j "d.data.id"; }
publish() { curl -s -X POST "$API/episodes" -H "Authorization: Bearer $1" -F "title=$2" -F "description=desc" \
    -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d.data.id"; }
unread() { body GET /notifications/unread-count "$1" | j "d.data.unreadCount"; }
nlist() { body GET "/notifications$2" "$1" | j "d.data.map(n=>n.id+':'+n.type+':'+(n.Actor?n.Actor.username:'-')+':ep='+(n.episodeId)+':'+(n.isRead?'lida':'NAO_LIDA')).join(' | ')"; }

echo "== 00. Preparação: contas A, B, C; episódio EB do B"
reg a; reg b; reg c
TA=$(login a); TB=$(login b); TC=$(login c)
UA=$(uid a); UB=$(uid b); UC=$(uid c)
EB=$(publish "$TB" "Episodio do B $S")
EA=$(publish "$TA" "Episodio da A $S")
echo "ids: A=$UA B=$UB C=$UC  EB=$EB EA=$EA"

echo; echo "== 01. Sem token: as quatro rotas -> 401"
echo "lista: $(code GET /notifications)  unread-count: $(code GET /notifications/unread-count)  marcar: $(code PATCH /notifications/1/read)  denunciar: $(code POST /episodes/$EB/report '' '{"reason":"spam"}')"

echo; echo "== 02. Curtir"
echo "B não lidas antes: $(unread "$TB")  (esperado 0)"
echo "A curte EB: $(code POST /episodes/$EB/toggle-like "$TA")  (201)"
echo "B não lidas: $(unread "$TB")  (esperado 1)"
echo "-- lista do B (Actor com só colunas públicas e o episódio):"
R=$(body GET /notifications "$TB"); echo "$R" | j "d.data.map(n=>({type:n.type,isRead:n.isRead,Actor:n.Actor,episode:n.episode}))"
echo -n "contém password/email/isAdmin? "; echo "$R" | grep -c '"password"\|"email"\|"isAdmin"'
echo "A curte o PRÓPRIO episódio EA: $(code POST /episodes/$EA/toggle-like "$TA") -> A continua com $(unread "$TA") (esperado 0)"
echo "A descurte EB: $(code POST /episodes/$EB/toggle-like "$TA")  (200) -> B: $(unread "$TB") (esperado 0)"
echo "A curte de novo: $(code POST /episodes/$EB/toggle-like "$TA") -> B: $(unread "$TB") (esperado 1, uma só)"

echo; echo "== 03. Comentar"
echo "C comenta EB: $(code POST /episodes/$EB/comments "$TC" '{"content":"muito bom"}') -> B: $(unread "$TB") (esperado 2)"
echo "B comenta o PRÓPRIO EB: $(code POST /episodes/$EB/comments "$TB" '{"content":"obrigado"}') -> B: $(unread "$TB") (esperado 2)"

echo; echo "== 04. Seguir"
echo "A segue B: $(code POST /users/$UB/toggle-follow "$TA") -> B: $(unread "$TB") (esperado 3)"
echo -n "aviso de follow (episodeId null): "; body GET /notifications "$TB" | j "JSON.stringify(d.data.filter(n=>n.type==='follow').map(n=>({actor:n.Actor.username,episodeId:n.episodeId})))"
echo "A deixa de seguir: $(code POST /users/$UB/toggle-follow "$TA") -> B: $(unread "$TB") (esperado 2)"
echo "A segue de novo: $(code POST /users/$UB/toggle-follow "$TA") -> B: $(unread "$TB") (esperado 3)"

echo; echo "== 05. Lista"
echo "ordem (mais nova primeiro):  $(nlist "$TB")"
echo "?limit=1&page=2:              $(nlist "$TB" '?limit=1&page=2')"
echo -n "página além do fim (?page=99) -> "; body GET "/notifications?page=99" "$TB" | j "JSON.stringify(d.data)"
echo -n "?page=abc&limit=-5 (padrões) -> "; body GET "/notifications?page=abc&limit=-5" "$TB" | j "d.data.length+' itens'"
echo "C vê só as dela: $(nlist "$TC")  (esperado vazio)"

echo; echo "== 06. Marcar como lida"
NID=$(body GET /notifications "$TB" | j "d.data[0].id")
echo "-- outra conta (403)";      req PATCH /notifications/$NID/read "$TA"
echo "-- inexistente (404)";      req PATCH /notifications/99999/read "$TB"
echo "-- abc (400)";              req PATCH /notifications/abc/read "$TB"
echo "-- a dona (200, unreadCount 2)"; req PATCH /notifications/$NID/read "$TB"
echo "-- repetir (200, mesmo número)"; req PATCH /notifications/$NID/read "$TB"
echo "lista reflete: $(nlist "$TB")"
echo "unread-count reflete: $(unread "$TB")"

echo; echo "== 07. Denúncia"
echo "-- A denuncia EB (201)";                   req POST /episodes/$EB/report "$TA" '{"reason":"spam"}'
echo "-- A repete (409)";                        req POST /episodes/$EB/report "$TA" '{"reason":"other"}'
echo "-- C denuncia o mesmo (201)";              req POST /episodes/$EB/report "$TC" '{"reason":"copyright"}'
echo "-- sem reason (400)";                      req POST /episodes/$EB/report "$TA" '{}'
echo "-- reason fora da lista (400)";            req POST /episodes/$EB/report "$TA" '{"reason":"chato"}'
echo "-- o rótulo no lugar da chave (400)";      req POST /episodes/$EB/report "$TA" '{"reason":"Spam ou golpes"}'
echo "-- id abc (400)";                          req POST /episodes/abc/report "$TA" '{"reason":"spam"}'
echo "-- episódio 99999 (404)";                  req POST /episodes/99999/report "$TA" '{"reason":"spam"}'
echo "-- o dono denunciando (400)";              req POST /episodes/$EB/report "$TB" '{"reason":"spam"}'
echo "-- sem token (401)";                       req POST /episodes/$EB/report "" '{"reason":"spam"}'
echo "o dono não ganhou notificação: B continua com $(unread "$TB") não lidas (esperado 2)"

echo; echo "== 08. No cliente de banco:"
echo "   INSERT INTO reports (user_id, episode_id, reason, created_at, updated_at) VALUES ($UA, $EB, 'spam', NOW(), NOW());  -> Duplicate entry ... idx_unique_report_user_episode"
echo "   INSERT INTO reports (user_id, episode_id, reason, created_at, updated_at) VALUES ($UB, $EA, 'chato', NOW(), NOW()); -> Data truncated for column 'reason'"

echo; echo "== 09. Excluir episódio com denúncias e curtidas/comentários de duas pessoas"
EX=$(publish "$TB" "Episodio descartavel $S")
code POST /episodes/$EX/toggle-like "$TA" >/dev/null; code POST /episodes/$EX/toggle-like "$TC" >/dev/null
code POST /episodes/$EX/comments "$TA" '{"content":"oi"}' >/dev/null; code POST /episodes/$EX/comments "$TC" '{"content":"oi"}' >/dev/null
code POST /episodes/$EX/report "$TA" '{"reason":"spam"}' >/dev/null; code POST /episodes/$EX/report "$TC" '{"reason":"other"}' >/dev/null
echo -n "avisos do B sobre EX antes: "; body GET "/notifications?limit=50" "$TB" | j "d.data.filter(n=>n.episodeId==$EX).length+' (esperado 4)'"
echo "exclusão: $(code DELETE /episodes/$EX "$TB")  (200)"
echo -n "avisos do B sobre EX depois: "; body GET "/notifications?limit=50" "$TB" | j "d.data.filter(n=>n.episodeId==$EX).length+' (esperado 0)'"
echo -n "avisos com episódio NULL que não são follow: "; body GET "/notifications?limit=50" "$TB" | j "d.data.filter(n=>n.episodeId===null&&n.type!=='follow').length+' (esperado 0)'"
echo "   (no banco: SELECT COUNT(*) FROM reports WHERE episode_id = $EX;  -> 0)"

echo; echo "== 10. O erro do logout (corpo \"null\"): 400 COM Access-Control-Allow-Origin"
curl -s -i -X POST "$API/logout" -H "Origin: $ORIGIN" -H "Content-Type: application/json" -d "null" | grep -iE "^HTTP|^access-control-allow-origin|message"

echo; echo "== 11. Regressão"
echo "curtir: $(code POST /episodes/$EA/toggle-like "$TB") / descurtir: $(code POST /episodes/$EA/toggle-like "$TB")  (201 / 200)"
echo "comentar: $(code POST /episodes/$EA/comments "$TB" '{"content":"regressao"}')"
echo "seguir: $(code POST /users/$UC/toggle-follow "$TA")  seguidores: $(code GET /users/$UC/followers)  seguindo: $(code GET /users/$UA/following)"
PL=$(body POST /playlists "$TA" '{"title":"Regressao"}' | j "d.data.id")
echo "playlists: criar $PL, salvar $(code POST /playlists/$PL/episodes "$TA" "{\"episodeId\":$EB}"), minhas $(code GET /my-playlists "$TA")"
echo "busca: $(code GET "/search?q=Episodio")  feed: $(code GET /feed "$TA")  feed seguindo: $(code GET /following-episodes "$TA")"
echo -n "upload: "; [ -n "$(publish "$TA" "Regressao $S")" ] && echo ok
echo "edição: $(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/episodes/$EA" -H "Authorization: Bearer $TA" -F "title=Editado $S")"
echo "users/abc/followers:"; req GET /users/abc/followers
