# Atividade 12 — o que há nesta pasta

- `checkpoint-02.md` — leitura guiada da API + tabela de pendência (Seção 13)
- `respostas.md` — rascunho das sete respostas (reescreva com as suas palavras)
- `testes-curl-atividade12.sh` — bateria da Parte A (paginação, transação, ids inválidos, regressão)
- `paginacao-antes.txt` / `paginacao-depois.txt` — mesmas chamadas, antes e depois da correção
- `regressao-api-saida.txt` — saída completa da bateria
- `parsepagination-unitario.txt` — `parsePagination` com entradas de borda

## O que NÃO dá para gerar sem navegador (fica com você)
Prints `.jpg` (toast de erro/sucesso/sobre o modal, aba Network com uma requisição, login sem toast,
os `curl`), o teste de regressão do Bloco 11 no navegador e os `.zip`.

## Como rodar a bateria da API
```bash
cd podwaveapi
API=http://localhost:4000/api bash "../podwavefrontend/01 - Docs/atividade12/testes-curl-atividade12.sh"
```
