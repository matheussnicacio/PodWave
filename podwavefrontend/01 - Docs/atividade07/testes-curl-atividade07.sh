#!/bin/bash
# ==============================================================================
# Testes de curl - Atividade 07 (PodWave) - PARTE A, Etapa 8
# ==============================================================================
# IMPORTANTE: rode este script de DENTRO da pasta podwaveapi.
#
# Antes de rodar, copie seus arquivos de teste para dentro desta mesma pasta
# com nomes simples (sem espaços, sem caminho longo) - isso evita um bug do
# curl no Git Bash/MSYS2 que falha ("Failed to open/read local data from
# file/application") quando o caminho é do tipo /c/Users/... combinado com
# ";type=...". Rode antes de tudo:
#
#   cp "/c/Users/pmath/Downloads/teste.mp3" ./audio-teste.mp3
#   cp "/c/Users/pmath/Downloads/avatars-A2zKakYYbtkhl3X7-moh6zA-t500x500.jpg" ./capa-teste.jpg
#
# Como usar:
# 1) Confira/ajuste TOKEN (se tiver expirado, rode o bloco 0 e cole o novo).
# 2) Rode: bash testes-curl-atividade07.sh
# 3) Tire um print de cada bloco de saída (o script já numera e separa cada um).
# ==============================================================================

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJtYXRoZXVzIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTc4OTUyMDIxNiwiZXhwIjoxNzg5NjA2NjE2fQ.p8I1vaB5emJo2e74SFbXWd9sZMldhqHIBCbj-QUsNF0"
AUDIO="audio-teste.mp3"
COVER="capa-teste.jpg"
BASE_URL="http://localhost:4000"

echo ""
echo "=============================================================="
echo "0) LOGIN -- POST /api/login (pega o token; ajuste TOKEN acima"
echo "   com o valor devolvido antes de rodar o resto, se precisar)"
echo "=============================================================="
curl -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"matheus@gmail.com","password":"matheus"}'
echo ""
echo ""

echo "=============================================================="
echo "1) UPLOAD COMPLETO -- espera 201 Created"
echo "=============================================================="
curl -i -X POST "$BASE_URL/api/episodes" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Episódio de teste" \
  -F "description=Descrição do episódio de teste" \
  -F "audio=@$AUDIO;type=audio/mpeg" \
  -F "cover=@$COVER;type=image/jpeg"
echo ""
echo ""

echo "=============================================================="
echo "2) SEM TITULO -- espera 400 (\"O título é obrigatório.\")"
echo "=============================================================="
curl -i -X POST "$BASE_URL/api/episodes" \
  -H "Authorization: Bearer $TOKEN" \
  -F "description=Sem título" \
  -F "audio=@$AUDIO;type=audio/mpeg" \
  -F "cover=@$COVER;type=image/jpeg"
echo ""
echo ""

echo "=============================================================="
echo "3) SEM AUDIO -- espera 400 (\"O arquivo de áudio é obrigatório.\")"
echo "=============================================================="
curl -i -X POST "$BASE_URL/api/episodes" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Sem áudio" \
  -F "cover=@$COVER;type=image/jpeg"
echo ""
echo ""

echo "=============================================================="
echo "4) SEM CAPA -- espera 400 (\"A imagem de capa é obrigatória.\")"
echo "=============================================================="
curl -i -X POST "$BASE_URL/api/episodes" \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Sem capa" \
  -F "audio=@$AUDIO;type=audio/mpeg"
echo ""
echo ""

echo "=============================================================="
echo "5) SEM TOKEN -- espera 401 (\"Não autorizado...\")"
echo "=============================================================="
curl -i -X POST "$BASE_URL/api/episodes" \
  -F "title=Sem token" \
  -F "audio=@$AUDIO;type=audio/mpeg" \
  -F "cover=@$COVER;type=image/jpeg"
echo ""
echo ""

echo "=============================================================="
echo "FIM DOS TESTES"
echo "=============================================================="