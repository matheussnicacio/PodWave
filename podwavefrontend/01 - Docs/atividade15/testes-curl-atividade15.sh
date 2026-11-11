#!/usr/bin/env bash
# Testes da Parte A (API) — Atividade 15: painel de administração.
# Segue a ordem da Etapa 5 do enunciado (Bloco 12 do roteiro de API).
#
# Uso (a partir de podwaveapi/, com a API rodando):
#   bash "../podwavefrontend/01 - Docs/atividade15/testes-curl-atividade15.sh"
# Variáveis opcionais:
#   API=http://localhost:4000/api   endereço da API
#   DB="mysql -uroot podwave_db"    comando do cliente de banco (para as
#                                   conferências com o banco); vazio = o
#                                   script só imprime o SQL para você rodar
#   AUDIO=./audio-teste.mp3 CAPA=./capa-teste.jpg
#
# Contas usadas (as quatro da ficha): admin, usuario_a, usuario_b, usuario_c,
# todas com a senha "senha123" e e-mail <username>@podwave.com. O script chama
# scripts/setAdmin.js (promover/rebaixar), então precisa rodar em podwaveapi/.
API="${API:-http://localhost:4000/api}"
DB="${DB:-}"
AUDIO="${AUDIO:-./audio-teste.mp3}"
CAPA="${CAPA:-./capa-teste.jpg}"
PASS="senha123"

j() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const r=eval(process.argv[1]); console.log(typeof r==='object'?JSON.stringify(r):r)" "$1"; }
req() { # req <método> <url> [token] [json] -> corpo (cortado) + status
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -w '\n[HTTP %{http_code}]\n' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}" | cut -c1-600
}
body() {
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
code() {
  local m="$1" u="$2" t="$3" b="$4"
  local args=(-s -g -o /dev/null -w '%{http_code}' -X "$m" "$API$u")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  curl "${args[@]}"
}
login() { curl -s -X POST "$API/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1@podwave.com\",\"password\":\"$PASS\"}" | j "d.data.token"; }
uid() { curl -s "$API/profile/$1" | j "d.data.id"; }
sql() { # sql "<consulta>" -> roda no banco (se DB definido) ou só imprime
  if [ -n "$DB" ]; then echo "sql> $1"; $DB -e "$1"; else echo "(rode no cliente de banco) $1"; fi
}
setadmin() { echo "\$ node scripts/setAdmin.js $*"; node scripts/setAdmin.js "$@" 2>&1 | grep -v "injected env"; }

echo "== 00. Preparação: tokens das quatro contas (o do ADMIN é emitido ANTES da promoção)"
setadmin admin off >/dev/null 2>&1
TADM=$(login admin); TA=$(login usuario_a); TB=$(login usuario_b); TC=$(login usuario_c)
UADM=$(uid admin); UA=$(uid usuario_a); UB=$(uid usuario_b); UC=$(uid usuario_c)
echo "ids: ADMIN=$UADM A=$UA B=$UB C=$UC"
echo "payload do token do ADMIN: $(echo "$TADM" | cut -d. -f2 | node -e "let s=require('fs').readFileSync(0,'utf8').trim(); console.log(Buffer.from(s,'base64url').toString())")"
setadmin admin

echo; echo "== 01. Sem token (401) e com o token de um usuário comum (403): as sete rotas + uma inexistente"
ROUTES=("GET /admin/dashboard" "GET /admin/reports" "PATCH /admin/reports/1/review" "GET /admin/users" \
        "PATCH /admin/users/$UB/block" "GET /admin/episodes" "DELETE /admin/episodes/1" "GET /admin/rota-inexistente")
for r in "${ROUTES[@]}"; do
  set -- $r
  printf '%-34s sem token: %s   usuário comum (A): %s\n' "$r" "$(code "$1" "$2")" "$(code "$1" "$2" "$TA" '{"isBlocked":true}')"
done
echo "-- corpo do 401 e do 403:"
req GET /admin/dashboard
req GET /admin/dashboard "$TA"

echo; echo "== 02. Dashboard com o token do ADMIN emitido ANTES da promoção (o papel vem do banco)"
req GET /admin/dashboard "$TADM"
sql "SELECT (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM users WHERE is_blocked=1) blockedUsers, (SELECT COUNT(*) FROM episodes) episodes, (SELECT COUNT(*) FROM comments) comments, (SELECT COUNT(*) FROM likes) likes, (SELECT COUNT(*) FROM reports WHERE status='pending') pendingReports, (SELECT COUNT(*) FROM reports WHERE status='reviewed') reviewedReports;"

echo; echo "== 03. Denúncias"
echo "-- padrão (pendentes, a mais nova primeiro):"
body GET /admin/reports "$TADM" | j "d.data.map(r=>r.id+':'+r.status+':'+r.reason+' por @'+r.Reporter.username+' em \"'+r.episode.title+'\" de @'+r.episode.author.username).join('\n')"
echo "-- chaves da primeira linha: $(body GET /admin/reports "$TADM" | j "Object.keys(d.data[0]).join(', ')")"
echo "-- Reporter: $(body GET /admin/reports "$TADM" | j "Object.keys(d.data[0].Reporter).join(', ')")"
echo "-- contém password/email/isAdmin? $(body GET /admin/reports "$TADM" | grep -c -E '"password"|"email"|"isAdmin"')"
echo "-- ?status=all: $(body GET '/admin/reports?status=all' "$TADM" | j "d.data.length") denúncias   ?status=reviewed: $(body GET '/admin/reports?status=reviewed' "$TADM" | j "d.data.length")"
echo "-- ?status=xyz:"; req GET '/admin/reports?status=xyz' "$TADM"
echo "-- ?limit=1&page=2: $(body GET '/admin/reports?limit=1&page=2' "$TADM" | j "d.data.map(r=>r.id).join(',')") (a segunda mais nova)"

echo; echo "== 04. Revisar"
RID=$(body GET /admin/reports "$TADM" | j "d.data[0].id")
echo "-- revisar a denúncia $RID:"; req PATCH "/admin/reports/$RID/review" "$TADM"
echo "-- repetir (idempotente, mesmo reviewedAt):"; req PATCH "/admin/reports/$RID/review" "$TADM"
echo "-- 99999: $(code PATCH /admin/reports/99999/review "$TADM")   abc: $(code PATCH /admin/reports/abc/review "$TADM")   token comum: $(code PATCH "/admin/reports/$RID/review" "$TA")"
echo "-- listas: pendentes=$(body GET /admin/reports "$TADM" | j "d.data.length")  revisadas=$(body GET '/admin/reports?status=reviewed' "$TADM" | j "d.data.map(r=>r.id).join(',')")"
echo "-- Dashboard: $(body GET /admin/dashboard "$TADM" | j "'pendingReports='+d.data.pendingReports+' reviewedReports='+d.data.reviewedReports")"

echo; echo "== 05. Usuários"
echo "-- lista (com e-mail e flags):"
body GET /admin/users "$TADM" | j "d.data.map(u=>u.id+' @'+u.username+' '+u.email+' admin='+u.isAdmin+' bloqueado='+u.isBlocked+' episódios='+u.episodesCount).join('\n')"
echo "-- contém password? $(body GET /admin/users "$TADM" | grep -c '"password"')"
echo "-- ?search=usuario_b: $(body GET '/admin/users?search=usuario_b' "$TADM" | j "d.data.map(u=>u.username).join(',')")"
echo "-- ?search=carla (nome): $(body GET '/admin/users?search=carla' "$TADM" | j "d.data.map(u=>u.username).join(',')")"
echo "-- ?search=usuario_c@podwave (e-mail): $(body GET '/admin/users?search=usuario_c@podwave' "$TADM" | j "d.data.map(u=>u.email).join(',')")"
echo "-- ?search=%25%25:"; req GET '/admin/users?search=%25%25' "$TADM"
echo "-- ?search=a&search=b (sem erro): $(code GET '/admin/users?search=a&search=b' "$TADM")"

echo; echo "== 06. Bloquear"
echo "-- bloquear B:"; req PATCH "/admin/users/$UB/block" "$TADM" '{"isBlocked":true}'
echo "-- repetir: $(code PATCH "/admin/users/$UB/block" "$TADM" '{"isBlocked":true}')"
echo "-- token ANTIGO de B em /profile/me:"; req GET /profile/me "$TB"
echo "-- login de B com a senha certa:"; req POST /login '' "{\"email\":\"usuario_b@podwave.com\",\"password\":\"$PASS\"}"
echo "-- login de B com a senha errada:"; req POST /login '' '{"email":"usuario_b@podwave.com","password":"errada123"}'
echo "-- perfil público de B (visitante): $(code GET /profile/usuario_b)"
echo "-- desbloquear B:"; req PATCH "/admin/users/$UB/block" "$TADM" '{"isBlocked":false}'
echo "-- o MESMO token de B volta a funcionar: $(code GET /profile/me "$TB")"
echo "-- erros: {} -> $(code PATCH "/admin/users/$UB/block" "$TADM" '{}')   \"true\" (texto) -> $(code PATCH "/admin/users/$UB/block" "$TADM" '{"isBlocked":"true"}')   a si mesmo -> $(code PATCH "/admin/users/$UADM/block" "$TADM" '{"isBlocked":true}')"
setadmin usuario_c >/dev/null
echo "-- outro administrador (C promovido só para o teste) -> $(code PATCH "/admin/users/$UC/block" "$TADM" '{"isBlocked":true}')   99999 -> $(code PATCH /admin/users/99999/block "$TADM" '{"isBlocked":true}')   abc -> $(code PATCH /admin/users/abc/block "$TADM" '{"isBlocked":true}')"
setadmin usuario_c off >/dev/null
echo "-- mensagens: $(body PATCH "/admin/users/$UB/block" "$TADM" '{}' | j "d.message") | $(body PATCH "/admin/users/$UB/block" "$TADM" '{"isBlocked":"true"}' | j "d.message") | $(body PATCH "/admin/users/$UADM/block" "$TADM" '{"isBlocked":true}' | j "d.message")"

echo; echo "== 07. Rebaixado: o mesmo token do ADMIN"
setadmin admin off
echo "dashboard com o mesmo token: $(code GET /admin/dashboard "$TADM")"
setadmin admin
echo "dashboard com o mesmo token: $(code GET /admin/dashboard "$TADM")"

echo; echo "== 08. Episódios (itens)"
echo "-- preparação: B publica um episódio; A curte (gera aviso para B); C denuncia"
EX=$(curl -s -X POST "$API/episodes" -H "Authorization: Bearer $TB" -F "title=Episodio para excluir pelo painel" -F "description=teste" \
  -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d.data.id")
curl -s -o /dev/null -X POST "$API/episodes/$EX/toggle-like" -H "Authorization: Bearer $TA"
curl -s -o /dev/null -X POST "$API/episodes/$EX/report" -H "Authorization: Bearer $TC" -H 'Content-Type: application/json' -d '{"reason":"spam"}'
echo "episódio $EX criado"
echo "-- lista (autor e pendingReportsCount):"
body GET /admin/episodes "$TADM" | j "d.data.map(e=>e.id+' \"'+e.title+'\" de @'+e.author.username+' pendentes='+e.pendingReportsCount).join('\n')"
sql "SELECT episode_id, COUNT(*) pendentes FROM reports WHERE status='pending' GROUP BY episode_id;"
echo "-- ?search=Cerrado: $(body GET '/admin/episodes?search=Cerrado' "$TADM" | j "d.data.map(e=>e.title).join(',')")   ?search=%25: $(body GET '/admin/episodes?search=%25' "$TADM" | j "JSON.stringify(d.data)")"
AUDIOF=$(body GET "/episodes/$EX" | j "d.data.audio"); COVERF=$(body GET "/episodes/$EX" | j "d.data.cover")
echo "-- ANTES:"; sql "SELECT (SELECT COUNT(*) FROM reports WHERE episode_id=$EX) reports, (SELECT COUNT(*) FROM notifications WHERE episode_id=$EX) notifications, (SELECT COUNT(*) FROM likes WHERE episode_id=$EX) likes, (SELECT episodes_count FROM users WHERE id=$UB) episodes_count_B;"
echo "arquivos no disco: $(ls public/uploads/episodes/audio/$AUDIOF public/uploads/episodes/covers/$COVERF 2>/dev/null | wc -l)"
echo "-- rota COMUM de excluir com o token do ADMIN (não é o dono):"; req DELETE "/episodes/$EX" "$TADM"
echo "-- rota do PAINEL:"; req DELETE "/admin/episodes/$EX" "$TADM"
echo "-- DEPOIS:"; sql "SELECT (SELECT COUNT(*) FROM reports WHERE episode_id=$EX) reports, (SELECT COUNT(*) FROM notifications WHERE episode_id=$EX) notifications, (SELECT COUNT(*) FROM likes WHERE episode_id=$EX) likes, (SELECT episodes_count FROM users WHERE id=$UB) episodes_count_B;"
echo "arquivos no disco: $(ls public/uploads/episodes/audio/$AUDIOF public/uploads/episodes/covers/$COVERF 2>/dev/null | wc -l)"
echo "-- repetir: $(code DELETE "/admin/episodes/$EX" "$TADM")   abc: $(code DELETE /admin/episodes/abc "$TADM")"

echo; echo "== 09. Regressão"
echo "login: $(code POST /login '' "{\"email\":\"usuario_a@podwave.com\",\"password\":\"$PASS\"}")  perfil: $(code GET /profile/me "$TA")  feed: $(code GET /feed "$TA")  seguindo: $(code GET /following-episodes "$TA")"
EN=$(curl -s -X POST "$API/episodes" -H "Authorization: Bearer $TA" -F "title=Regressao upload" -F "description=r" \
  -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA;type=image/jpeg" | j "d.data.id")
echo "upload: episódio $EN   curtir: $(code POST "/episodes/$EN/toggle-like" "$TB")  comentar: $(code POST "/episodes/$EN/comments" "$TB" '{"content":"ok"}')  seguir: $(code POST "/users/$UA/toggle-follow" "$TB")  desfazer seguir: $(code POST "/users/$UA/toggle-follow" "$TB")"
echo "notificações de A: $(code GET /notifications "$TA")  não lidas: $(body GET /notifications/unread-count "$TA" | j "d.data.unreadCount")  denunciar: $(code POST "/episodes/$EN/report" "$TC" '{"reason":"other"}')"
echo "busca q=Cerrado: $(body GET '/search?q=Cerrado' | j "d.data.podcasts.length") episódio(s)   q=%25%25: $(body GET '/search?q=%25%25' | j "JSON.stringify(d.data)")"
echo "token lixo:"; req GET /profile/me lixo
echo "-- limpeza: excluir o episódio da regressão: $(code DELETE "/episodes/$EN" "$TA")"
