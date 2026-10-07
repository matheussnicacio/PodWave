#!/bin/bash
# ==============================================================================
# Testes de curl - Atividade 09 (PodWave) - PARTE A
# ==============================================================================
# Rode de DENTRO da pasta podwaveapi, com a API no ar (npm run dev).
#
#   EMAIL_A=a@email.com SENHA_A=123456 EMAIL_B=b@email.com SENHA_B=123456 \
#   AUDIO=./exemplo.mp3 CAPA1=./capa1.png CAPA2=./capa2.png \
#   bash testes-curl-atividade09.sh
#
# A = dono dos episódios. B = outra conta (tem que existir, sem episódios).
# O script faz o login sozinho (nada de token colado no arquivo), cria dois
# episódios para A e mostra a CONTAGEM DE ARQUIVOS antes/depois dos testes de
# PUT/DELETE (é isso que prova que não sobrou arquivo órfão).
# Tire um print de cada bloco numerado.
# ==============================================================================

BASE_URL="${BASE_URL:-http://localhost:4000}"
EMAIL_A="${EMAIL_A:?Defina EMAIL_A=...}"; SENHA_A="${SENHA_A:?Defina SENHA_A=...}"
EMAIL_B="${EMAIL_B:?Defina EMAIL_B=...}"; SENHA_B="${SENHA_B:?Defina SENHA_B=...}"
AUDIO="${AUDIO:?Defina AUDIO=caminho/do.mp3}"
CAPA1="${CAPA1:?Defina CAPA1=caminho/da/capa1.png}"
CAPA2="${CAPA2:?Defina CAPA2=caminho/da/capa2.png}"
UPLOADS="${UPLOADS:-./public/uploads/episodes}"

sep() { echo ""; echo "=============================================================="; echo "$1"; echo "=============================================================="; }
files() { echo "[arquivos] audio: $(ls "$UPLOADS/audio" 2>/dev/null | wc -l) | covers: $(ls "$UPLOADS/covers" 2>/dev/null | wc -l)"; }
login() { curl -s -X POST "$BASE_URL/api/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }
req() { curl -s -w "\n[HTTP %{http_code}]\n" "$@"; }
idof() { sed -n 's/.*"data":{"id":\([0-9]*\).*/\1/p'; }

TA=$(login "$EMAIL_A" "$SENHA_A"); TB=$(login "$EMAIL_B" "$SENHA_B")
USER_A=$(curl -s -H "Authorization: Bearer $TA" "$BASE_URL/api/profile/me" | sed -n 's/.*"username":"\([^"]*\)".*/\1/p')

sep "0) PREPARO -- cria 2 episódios de A (POST /api/episodes)"
ID1=$(curl -s -X POST "$BASE_URL/api/episodes" -H "Authorization: Bearer $TA" -F "title=Episodio 1" -F "description=primeiro" -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA1;type=image/png" | idof)
ID2=$(curl -s -X POST "$BASE_URL/api/episodes" -H "Authorization: Bearer $TA" -F "title=Episodio 2" -F "description=segundo" -F "audio=@$AUDIO;type=audio/mpeg" -F "cover=@$CAPA1;type=image/png" | idof)
echo "ids criados: $ID1 e $ID2"; files

sep "1) DETALHE x2 -- contagens consecutivas (reload)"
req "$BASE_URL/api/episodes/$ID1" | grep -o '"views":[0-9]*'
req "$BASE_URL/api/episodes/$ID1" | grep -o '"views":[0-9]*'

sep "2a) GET /my-episodes sem token -> 401"
req "$BASE_URL/api/my-episodes"
sep "2b) GET /my-episodes com A -> lista, mais novo primeiro"
req -H "Authorization: Bearer $TA" "$BASE_URL/api/my-episodes"
sep "2c) GET /my-episodes com B (sem itens) -> []"
req -H "Authorization: Bearer $TB" "$BASE_URL/api/my-episodes"

sep "3a) GET /episodes/:id/edit sem token -> 401"
req "$BASE_URL/api/episodes/$ID1/edit"
sep "3b) com B -> 403"
req -H "Authorization: Bearer $TB" "$BASE_URL/api/episodes/$ID1/edit"
sep "3c) id inexistente -> 404"
req -H "Authorization: Bearer $TA" "$BASE_URL/api/episodes/999999/edit"
sep "3d) com A -> 200 (views NÃO muda: antes/depois)"
echo -n "views antes: "; req "$BASE_URL/api/episodes/$ID2" | grep -o '"views":[0-9]*'
req -H "Authorization: Bearer $TA" "$BASE_URL/api/episodes/$ID2/edit"
echo -n "views depois (+1 só do GET acima, não do /edit): "; req "$BASE_URL/api/episodes/$ID2" | grep -o '"views":[0-9]*'

sep "4) PUT só texto, com A -> 200, capa inalterada"
files
req -X PUT -H "Authorization: Bearer $TA" -F "title=Titulo editado" -F "description=desc editada" "$BASE_URL/api/episodes/$ID1"
files

sep "5) PUT com capa nova, com A -> 200, nome mudou, contagem igual"
files
req -X PUT -H "Authorization: Bearer $TA" -F "title=Com capa nova" -F "cover=@$CAPA2;type=image/png" "$BASE_URL/api/episodes/$ID1"
files

sep "6a) ÓRFÃOS: PUT com capa nova feito por B -> 403, contagem não sobe"
files
req -X PUT -H "Authorization: Bearer $TB" -F "title=invasor" -F "cover=@$CAPA2;type=image/png" "$BASE_URL/api/episodes/$ID1"
sleep 0.5; files
sep "6b) ÓRFÃOS: PUT com capa nova e título vazio por A -> 400, contagem não sobe"
files
req -X PUT -H "Authorization: Bearer $TA" -F "title=" -F "cover=@$CAPA2;type=image/png" "$BASE_URL/api/episodes/$ID1"
sleep 0.5; files

sep "7) PERFIL PÚBLICO"
echo "-- anônimo (isOwner:false)";  req "$BASE_URL/api/profile/$USER_A" | grep -oE '"isOwner":[a-z]+|"title":"[^"]*"'
echo "-- com A (isOwner:true)";     req -H "Authorization: Bearer $TA" "$BASE_URL/api/profile/$USER_A" | grep -oE '"isOwner":[a-z]+'
echo "-- com B (isOwner:false)";    req -H "Authorization: Bearer $TB" "$BASE_URL/api/profile/$USER_A" | grep -oE '"isOwner":[a-z]+'
echo "-- inexistente (404)";        req "$BASE_URL/api/profile/ninguem_existe_123"

sep "8) DELETE"
echo -n "episodesCount antes: "; curl -s -H "Authorization: Bearer $TA" "$BASE_URL/api/profile/me" | grep -o '"episodesCount":[0-9]*'; files
echo "-- com B -> 403";  req -X DELETE -H "Authorization: Bearer $TB" "$BASE_URL/api/episodes/$ID1"
echo "-- com A -> 200";  req -X DELETE -H "Authorization: Bearer $TA" "$BASE_URL/api/episodes/$ID1"
echo "-- GET do item -> 404"; req "$BASE_URL/api/episodes/$ID1"
echo -n "episodesCount depois: "; curl -s -H "Authorization: Bearer $TA" "$BASE_URL/api/profile/me" | grep -o '"episodesCount":[0-9]*'; files
echo "-- repetir DELETE -> 404"; req -X DELETE -H "Authorization: Bearer $TA" "$BASE_URL/api/episodes/$ID1"
