# TUTORIAL DE IMPLEMENTAÇÃO — CMS Docs v2
## Passo a passo objetivo para substituição do sistema

---

## O QUE MUDA NA v2

| Arquivo         | Ação        | Descrição                                      |
|-----------------|-------------|------------------------------------------------|
| `Code.gs`       | SUBSTITUIR  | Backend completo reescrito                     |
| `config/config.js` | SUBSTITUIR  | Novos tokens e módulos                      |
| `js/api.js`     | SUBSTITUIR  | Todos os endpoints novos                       |
| `home.html`     | NOVO        | Página inicial configurável (era index.html)   |
| `index.html`    | MANTER      | Passa a ser o módulo Documentos                |
| `change-password.html` | NOVO | Troca de senha pelo conselheiro             |
| `solicitacoes.html`    | NOVO | Sistema de solicitações com protocolo       |
| `Painel.html` (GAS)    | ATUALIZAR | Adicionar aba de Log e Avisos            |
| `FormAviso.html` (GAS) | NOVO | Formulário de novo aviso                    |

---

## PASSO 1 — Atualizar o Google Apps Script

1. Abra script.google.com
2. Abra o projeto do CMS Docs
3. Selecione tudo no `Code.gs` → Delete → Cole o conteúdo do novo `Code.gs`
4. Salve (Ctrl+S)
5. **NÃO implante ainda** — continue para o passo 2

---

## PASSO 2 — Rodar o Setup da Planilha

1. Ainda no Apps Script, clique em **Executar** → selecione a função `runSetup`
2. Autorize as permissões se pedido
3. Aguarde — uma caixa de diálogo aparecerá listando o que foi criado/atualizado

O setup vai:
- ✅ Criar as abas: AVISOS, ATAS, REUNIOES, PRESENCAS, ATA_APROVACOES, SOLICITACOES, MEU_DOCS, LOG, VOTACOES, VOTOS, EVENTOS, COMISSOES, COMISSAO_MEMBROS
- ✅ Adicionar colunas faltantes nas abas existentes (DOCUMENTOS ganha DESTAQUE e MIDIA; CONSELHEIROS ganha PERFIL e ULTIMO_ACESSO)
- ✅ Formatar todos os cabeçalhos (azul escuro, branco, negrito)
- ✅ Preencher CONFIG e CATEGORIAS com valores padrão
- ✅ Não apaga nenhum dado existente

---

## PASSO 3 — Verificar colunas novas na planilha

### Aba DOCUMENTOS — novas colunas (já adicionadas pelo setup):
| Coluna    | Valores válidos                                         |
|-----------|---------------------------------------------------------|
| ACESSO    | publico · diretoria · presidente · secretaria           |
| DESTAQUE  | (vazio) · novo · lei · urgente · recomendado · video · portaria |
| MIDIA     | pdf · video · link · imagem                             |

### Aba CONSELHEIROS — novas colunas:
| Coluna        | Valores válidos                                    |
|---------------|----------------------------------------------------|
| PERFIL        | publico · diretoria · presidente · secretaria · admin |
| ULTIMO_ACESSO | Preenchido automaticamente pelo sistema            |

**Ação:** Preencha a coluna PERFIL para os membros da diretoria e presidente.

---

## PASSO 4 — Reimplantar o Apps Script

1. Clique em **Implantar → Gerenciar implantações**
2. Clique no lápis (editar) na implantação existente
3. Em Versão, selecione **"Nova versão"**
4. Clique em **Implantar**
5. A URL **não muda** — nenhuma alteração necessária no config.js

---

## PASSO 5 — Atualizar os arquivos do GitHub

Substitua/adicione os seguintes arquivos no repositório:

```
/config/config.js         → SUBSTITUIR (novo)
/js/api.js                → SUBSTITUIR (novo)
/home.html                → ADICIONAR (novo — página inicial)
/change-password.html     → ADICIONAR (novo)
/solicitacoes.html        → ADICIONAR (novo)
```

O `index.html` existente **não precisa mudar** — ele continua como o módulo Documentos.

**Commit sugerido:**
```
git add .
git commit -m "feat: v2.0 - home configurável, solicitações, troca de senha, destaques, atas, setup automático"
git push
```

---

## PASSO 6 — Atualizar o login para redirecionar para home.html

No `login.html` existente, localize a linha:
```js
window.location.replace('index.html');
```
Troque para:
```js
window.location.replace('home.html');
```

---

## PASSO 7 — Configurar a HOME pelo CONFIG da planilha

Na aba CONFIG da planilha, edite os valores:

| CHAVE               | VALOR (exemplo)                                |
|---------------------|------------------------------------------------|
| home_titulo         | Conselho Municipal<br>de <em>Saúde</em>        |
| home_subtitulo      | Montes Claros — MG                             |
| home_texto          | Bem-vindos ao sistema digital do CMS-MOC.      |
| home_imagem         | (URL de uma imagem opcional)                   |
| home_banner_texto   | (texto do banner — deixe vazio para ocultar)   |
| home_banner_cor     | blue (ou green, yellow, red)                   |

---

## PASSO 8 — Testar o sistema

Checklist de teste:

- [ ] Login com conselheiro comum → redireciona para home.html
- [ ] Home mostra os módulos corretos para o perfil
- [ ] Troca de senha funciona
- [ ] Documentos carregam com filtros funcionando
- [ ] Solicitação enviada → aparece protocolo + e-mail chega (verificar EMAIL_DIRETORIA no Code.gs)
- [ ] Login com perfil diretoria → módulo Diretoria aparece na home
- [ ] Log registra acessos na aba LOG

---

## PASSO 9 — Configurar e-mails para solicitações

No `Code.gs`, localize e preencha:
```js
const EMAIL_DIRETORIA = ['email1@prefeitura.mg.gov.br', 'email2@...'];
const EMAIL_SECRETARIA = 'secretaria@cmsmoc.mg.gov.br';
```
Reimplante após alterar (nova versão, mesma URL).

---

## PRÓXIMOS PASSOS (não incluídos neste pacote — implementar depois)

- `atas.html` — módulo de atas com filtros e aprovação
- `reunioes.html` — módulo de reuniões e presenças
- `meus-documentos.html` — documentos individuais por conselheiro
- `diretoria.html` — área restrita da diretoria
- `presidente.html` — painel do presidente com pendências
- `admin.html` — dashboard admin no GitHub (separado)
- `FormAviso.html` no GAS — para criar avisos pelo Sheets

---

## NOTAS IMPORTANTES

**Abas que já existiam e não mudam:**
- CONSELHEIROS — apenas ganham 2 colunas novas no final
- DOCUMENTOS — apenas ganham 3 colunas novas no final (ACESSO, DESTAQUE, MIDIA)
- CATEGORIAS — se já estava preenchida, mantém os dados

**Se algo der errado no setup:**
- O setup nunca apaga dados
- Se criar uma aba com conflito de nome, ele informa no relatório
- Você pode rodar o setup quantas vezes quiser — ele é idempotente

**URL do sistema não muda:**
- GitHub Pages: mesma URL
- Apps Script: mesma URL de implantação
- Domínio: sem alteração
