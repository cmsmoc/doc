# CMS Docs PWA
**Sistema de Documentos Institucionais — Conselho Municipal de Saúde de Montes Claros**
Secretaria Executiva | Versão 1.0

---

## Visão Geral

PWA (Progressive Web App) para acesso a documentos institucionais do CMS-MOC.
Permite que conselheiros façam login, busquem e acessem documentos oficiais diretamente do celular ou computador.

**Stack:**
- Frontend: HTML + CSS + JavaScript (Vanilla)
- Backend: Google Apps Script + Google Sheets
- Hospedagem: GitHub Pages
- Documentos: Google Drive (links na planilha)

---

## Estrutura do Projeto

```
/cms-docs-pwa
├── index.html              ← Dashboard principal (protegido)
├── login.html              ← Tela de login
│
├── /css
│   ├── brand.css           ← Tokens de identidade visual (cores, tipografia)
│   └── style.css           ← Estilos globais, componentes, layout
│
├── /js
│   ├── app.js              ← Orquestrador do dashboard
│   ├── auth.js             ← Autenticação e gestão de sessão
│   ├── api.js              ← Comunicação com o Apps Script
│   ├── search.js           ← Lógica de busca e filtros
│   ├── ui.js               ← Renderização e componentes de UI
│   └── login.js            ← Lógica da tela de login
│
├── /pwa
│   ├── manifest.json       ← Manifesto PWA (instalação no celular)
│   └── service-worker.js   ← Cache offline e estratégias de rede
│
├── /config
│   └── config.js           ← Configurações centrais (URLs, chaves, cores)
│
└── /docs
    ├── README.md           ← Este arquivo
    └── Code.gs             ← Código do Google Apps Script
```

---

## Configuração Inicial

### 1. Planilha Google Sheets

A planilha já existe com ID: `1_6uxp2YjjmOKa5xkyc_l4jnVpCCex-M1GaXVSTn3HAM`

**Abas necessárias:**

#### CONSELHEIROS (já existe)
| Coluna     | Tipo     | Descrição                          |
|------------|----------|------------------------------------|
| ID_CONS    | Texto    | Identificador único                |
| SEGMENTO   | Texto    | Segmento do conselheiro            |
| ENTIDADE   | Texto    | Entidade que representa            |
| CADEIRA    | Texto    | Número/identificação da cadeira    |
| NOME       | Texto    | Nome completo                      |
| TELEFONE   | Texto    | Telefone de contato                |
| EMAIL      | Texto    | E-mail                             |
| RG         | Texto    | RG                                 |
| CPF        | Texto    | CPF                                |
| ENDERECO   | Texto    | Endereço                           |
| STATUS     | Texto    | `ativo` ou `inativo`               |
| SENHA      | Texto    | Senha de acesso (texto simples)    |

#### DOCUMENTOS (criar)
| Coluna    | Tipo     | Descrição                              |
|-----------|----------|----------------------------------------|
| ID        | Texto    | Identificador único (ex: DOC-001)      |
| TITULO    | Texto    | Título do documento                    |
| TIPO      | Texto    | Portaria / Resolução / Memorando etc.  |
| ANO       | Número   | Ano do documento (ex: 2025)            |
| DATA      | Data     | Data de publicação                     |
| DESCRICAO | Texto    | Descrição breve (opcional)             |
| LINK      | URL      | Link de compartilhamento do Google Drive |
| STATUS    | Texto    | `ativo` ou `arquivado`                 |

> **Como obter o link do Google Drive:**
> No Google Drive, clique com botão direito no PDF → "Compartilhar" → "Copiar link"
> Certifique-se de que o arquivo está com acesso: "Qualquer pessoa com o link"

#### CATEGORIAS (opcional — criar se quiser personalizar)
| Coluna | Tipo   | Descrição                              |
|--------|--------|----------------------------------------|
| TIPO   | Texto  | Nome do tipo (ex: Resolução)           |
| BADGE  | Texto  | Classe CSS (badge-blue, badge-green, badge-navy, badge-yellow, badge-gray) |
| ICON   | Emoji  | Ícone (ex: ⚖️)                         |

#### CONFIG (opcional — criar para configs dinâmicas)
| Coluna | Tipo   | Descrição                              |
|--------|--------|----------------------------------------|
| CHAVE  | Texto  | Nome da configuração                   |
| VALOR  | Texto  | Valor                                  |

---

### 2. Google Apps Script

1. Abra a planilha Google Sheets
2. Menu: **Extensões → Apps Script**
3. Apague o código padrão
4. Cole o conteúdo de `docs/Code.gs`
5. Salve (Ctrl+S)
6. Clique em **Implantar → Nova implantação**
7. Tipo: **App da Web**
8. Configurações:
   - Execute como: **Eu mesmo**
   - Quem tem acesso: **Qualquer pessoa, mesmo anônimos**
9. Clique em **Implantar**
10. Copie a URL gerada (começa com `https://script.google.com/macros/s/...`)

---

### 3. Configurar o config.js

Abra `config/config.js` e substitua:

```js
API: {
  GAS_URL: 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec',
```

Cole a URL copiada no passo anterior.

---

### 4. Deploy no GitHub Pages

O repositório já existe em: `http://cmsmoc.github.io/doc`

```bash
# 1. Clone o repositório
git clone https://github.com/cmsmoc/doc.git

# 2. Copie todos os arquivos do projeto para a pasta clonada
cp -r cms-docs-pwa/* doc/

# 3. Entre na pasta
cd doc

# 4. Commit e push
git add .
git commit -m "feat: implantação inicial do CMS Docs PWA v1.0"
git push origin main
```

**Configuração do GitHub Pages:**
1. Vá em: `Settings → Pages`
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)`
4. Salve

O site ficará disponível em: `https://cmsmoc.github.io/doc/`

---

### 5. Ajustar caminhos do Service Worker

No arquivo `pwa/service-worker.js`, os caminhos têm o prefixo `/doc/`.
Se o repositório não estiver na subpasta `/doc`, ajuste para `/`.

No `pwa/manifest.json`, ajuste também:
```json
"start_url": "/doc/index.html",
"scope": "/doc/"
```

---

## Fluxo da Aplicação

```
Usuário acessa login.html
  │
  ├─→ api.js carrega lista de conselheiros (GAS → Sheets CONSELHEIROS)
  │
  ├─→ Usuário seleciona nome + digita senha
  │
  ├─→ auth.js envia para GAS (action=login)
  │     GAS valida NOME + SENHA + STATUS=ativo
  │
  ├─[Sucesso]→ Sessão salva no localStorage
  │            Redireciona para index.html
  │
  └─[Falha]→ Exibe mensagem de erro

Usuário no dashboard (index.html)
  │
  ├─→ auth.js verifica sessão (se não existir → redireciona para login)
  │
  ├─→ api.js carrega documentos (GAS → Sheets DOCUMENTOS)
  │     Cache local de 15 minutos
  │
  ├─→ ui.js renderiza grid de cards
  │
  ├─→ Busca em tempo real (search.js filtra localmente)
  │
  └─→ Clique no card → abre PDF no Google Drive
```

---

## Expansão Futura

O sistema foi arquitetado para crescer. Próximos módulos planejados:

| Módulo           | Descrição                                    | Status    |
|------------------|----------------------------------------------|-----------|
| Atas de Reunião  | Tipo específico de documento com acesso      | Planejado |
| Votações         | Registro de votações e deliberações          | Planejado |
| Calendário       | Reuniões e eventos do Conselho               | Planejado |
| Notificações     | Push notifications via Service Worker        | Planejado |
| Biblioteca Legal | Leis, normativas, resoluções CNS             | Planejado |
| Painel Admin     | Interface no GAS para gestão de documentos   | Planejado |

Para adicionar um novo módulo:
1. Crie um novo arquivo JS em `/js/`
2. Adicione a aba correspondente na planilha
3. Adicione o handler no `Code.gs`
4. Inclua o script no HTML correspondente

---

## Segurança

- Login validado via Google Apps Script (não apenas frontend)
- STATUS do conselheiro verificado no servidor
- Sessão armazenada em localStorage com dados não sensíveis
- Sem armazenamento de senha no cliente
- Redirecionamento automático se sessão inválida

> **Nota:** Para um ambiente de alta criticidade, considere implementar
> tokens de sessão com expiração no servidor. A arquitetura atual é
> adequada para o contexto de uso do CMS-MOC.

---

## Manutenção

### Atualizar documentos
Acesse a planilha Google Sheets e edite a aba **DOCUMENTOS**.
O sistema atualiza automaticamente a cada 15 minutos (TTL do cache).
Para forçar atualização imediata: botão **↻** no dashboard.

### Adicionar/remover conselheiros
Edite a aba **CONSELHEIROS**.
Para desativar (sem excluir): mude STATUS para `inativo`.

### Atualizar o Apps Script
Após qualquer mudança no `Code.gs`:
1. Salve o script
2. Implante novamente (nova versão)
3. A URL de implantação pode mudar — atualize `config.js`

---

## Contato

**Secretaria Executiva — Conselho Municipal de Saúde de Montes Claros**
Sistema desenvolvido para uso interno dos conselheiros municipais.
