# Finanças AI — Guia de Redesign Visual e UX

## Objetivo
Este documento orienta a melhoria visual do front-end do sistema **Finanças AI**, com foco em:
- deixar a interface mais elegante, limpa e moderna;
- organizar melhor o dashboard;
- reduzir a sensação de informações “jogadas”;
- manter estética sóbria, pouco colorida e profissional;
- padronizar layout, tipografia, componentes, gráficos e hierarquia visual.

---

## Diagnóstico geral das telas atuais

### Pontos positivos
- estrutura funcional já existe;
- navegação principal está clara;
- CRUDs básicos estão compreensíveis;
- dashboard já possui KPIs e gráfico inicial.

### Problemas visuais percebidos
1. **Interface excessivamente neutra e sem personalidade**.
2. **Muito espaço branco sem intencionalidade**, gerando sensação de vazio.
3. **Cards e tabelas parecem todos iguais**, sem hierarquia de importância.
4. **Dashboard com blocos soltos**, sem agrupamento por contexto.
5. **Baixo contraste entre áreas**, principalmente containers e fundo.
6. **Tipografia pouco refinada**, sem escala visual clara entre títulos, subtítulos, labels e valores.
7. **Formulários visualmente secos**, com pouca diferenciação entre ações primárias e secundárias.
8. **Tabelas muito “planas”**, parecendo planilha simples.
9. **Gráfico donut sem composição visual forte**, com pouca integração com o restante da tela.
10. **Ausência de identidade visual**: falta uma paleta, padrão de estados, badges, ícones e ritmo visual.

---

## Direção visual recomendada

### Estilo desejado
Adotar uma estética:
- minimalista;
- sofisticada;
- sóbria;
- com pouco uso de cor;
- baseada em tons neutros, com 1 cor de destaque principal;
- forte uso de contraste entre superfícies;
- sensação de produto financeiro premium.

### Referência de sensação visual
A interface deve se parecer mais com:
- painel financeiro moderno;
- software SaaS premium minimalista;
- dashboard executivo limpo;
- componentes com bom espaçamento, sombras leves e foco em legibilidade.

### O que evitar
- cores saturadas demais;
- muitos cards com bordas pesadas;
- excesso de cinza claro sem profundidade;
- gráficos multicoloridos demais;
- vários botões competindo visualmente;
- tabelas sem agrupamento e sem destaque de informação chave.

---

## Stack visual recomendada

### Base recomendada
- **Next.js**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide Icons**
- **Recharts** para gráficos
- **class-variance-authority (cva)** para variantes de componentes
- **tailwind-merge** para composição de classes

### Por que usar Tailwind + shadcn/ui
Essa combinação é a melhor para esse projeto porque:
- acelera muito a evolução visual;
- mantém consistência entre telas;
- facilita criação de cards, tabelas, forms, sheets, tabs e dialogs;
- permite um visual moderno sem depender de UI kits pesados;
- funciona muito bem com layout sóbrio e refinado.

### Componentes shadcn/ui recomendados
- `Card`
- `Button`
- `Input`
- `Select`
- `Tabs`
- `Badge`
- `Table`
- `Separator`
- `Dialog`
- `Drawer`
- `Popover`
- `Tooltip`
- `DropdownMenu`
- `Skeleton`
- `AlertDialog`
- `Calendar`
- `Command`

---

## Paleta de cores recomendada

Como a preferência é por algo pouco colorido, a base deve ser neutra com **uma cor principal fria e discreta**.

### Paleta principal
- **Background principal:** `#F6F7F8`
- **Surface / cards:** `#FFFFFF`
- **Surface secundária:** `#F1F3F5`
- **Border:** `#E5E7EB`
- **Border forte:** `#D1D5DB`
- **Texto principal:** `#111827`
- **Texto secundário:** `#6B7280`
- **Texto suave:** `#9CA3AF`
- **Cor primária (accent):** `#1F4B46`
- **Primária hover:** `#183A36`
- **Primária suave:** `#DCEAE7`

### Cores de estado
Usar com moderação.
- **Sucesso:** `#2F6F57`
- **Sucesso suave:** `#E7F4ED`
- **Atenção:** `#8A6A2F`
- **Atenção suave:** `#F7F0E3`
- **Erro:** `#8B3A3A`
- **Erro suave:** `#F9E7E7`
- **Info discreto:** `#4B5563`
- **Info suave:** `#EEF2F7`

### Regra de uso das cores
- 80% da interface em neutros;
- 15% em variações leves de superfície/borda;
- 5% em cor de destaque;
- usar vermelho, verde e amarelo apenas para estados reais do sistema.

---

## Tipografia e hierarquia visual

### Fonte recomendada
- **Inter** ou **Manrope**

### Escala tipográfica
- **Título da página:** 30px / semibold
- **Subtítulo da página:** 14px / regular / texto secundário
- **Título de seção:** 18px / semibold
- **Título de card:** 14px / medium
- **KPI principal:** 32px / bold
- **KPI secundário:** 20px / semibold
- **Texto padrão:** 14px / regular
- **Label de formulário:** 13px / medium
- **Texto auxiliar:** 12px / regular

### Melhorias
- aumentar contraste dos títulos;
- reduzir sensação de texto “lavado”;
- dar mais peso visual para números e valores monetários;
- usar `tracking-tight` em títulos e KPIs;
- usar `leading-none` ou `leading-tight` em números grandes.

---

## Sistema de layout

### Container principal
- largura máxima: `1280px` ou `1400px`
- padding lateral: `24px` desktop / `16px` mobile
- espaçamento vertical entre seções: `24px` a `32px`

### Grid recomendado
- dashboard: grid de 12 colunas
- CRUDs: blocos com largura máxima mais controlada
- formulários: dividir em grupos, não deixar tudo solto numa única linha longa

### Espaçamento
Padronizar usando escala fixa:
- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`
- `40`

Evitar espaçamentos aleatórios.

---

## Componentização visual recomendada

### 1. App Shell
Criar um shell consistente com:
- topbar fixa ou sticky;
- nome do produto + ícone simples;
- navegação principal com estado ativo claro;
- possível toggle de tema no futuro;
- área principal com espaçamento consistente.

### 2. Cards
Os cards devem ter:
- fundo branco;
- borda fina discreta;
- sombra muito leve (`shadow-sm`);
- cantos `rounded-xl` ou `rounded-2xl`;
- padding generoso (`p-5` ou `p-6`).

### 3. Inputs
Melhorar inputs com:
- altura consistente (`h-10` ou `h-11`);
- placeholder mais suave;
- foco com `ring` usando cor primária suave;
- labels acima do campo;
- texto auxiliar abaixo quando necessário.

### 4. Tabelas
As tabelas precisam parecer menos planilha e mais sistema:
- cabeçalho com fundo muito suave;
- hover nas linhas;
- células com mais padding vertical;
- badges para tipo/status;
- ações alinhadas à direita;
- colunas numéricas alinhadas à direita.

### 5. Badges
Usar badges para:
- status de fatura;
- tipo fixo/variável;
- parcelado/à vista;
- pago/pendente.

### 6. Empty states
Quando não houver dados:
- usar ícone discreto;
- mensagem curta;
- CTA claro de próxima ação.

---

## Redesign do dashboard

## Problema atual do dashboard
Atualmente o dashboard mostra KPIs e gráfico, mas sem uma narrativa visual. Tudo aparece como uma sequência de cards com o mesmo peso visual.

## Objetivo do novo dashboard
O dashboard deve responder rapidamente:
1. quanto foi gasto no mês;
2. quanto está comprometido nas próximas faturas;
3. quais são os maiores grupos de gasto;
4. qual cartão exige atenção agora;
5. como o mês atual se compara ao anterior.

## Estrutura recomendada do dashboard

### Bloco 1 — Cabeçalho do dashboard
No topo deve existir um header mais forte com:
- título `Dashboard Financeiro`;
- subtítulo curto;
- seletor de competência;
- seletor de visão: `Por ocorrência` / `Por pagamento`;
- possível resumo do mês ao lado.

#### Sugestão de composição
Esquerda:
- título
- subtítulo

Direita:
- filtro de mês
- tabs de visão

---

### Bloco 2 — KPIs principais (linha premium)
Primeira linha com **4 KPIs mais importantes**, maiores que os demais.

#### KPIs sugeridos
1. **Total do mês**
2. **Próxima fatura**
3. **Faturas em aberto**
4. **Comprometido do mês**

#### Regra visual
- esses cards devem ser maiores;
- ao menos o primeiro card pode ter leve destaque com fundo primário muito suave;
- usar ícones discretos;
- mostrar variação vs mês anterior quando aplicável.

Exemplo de microinformações dentro do card:
- valor principal
- label auxiliar
- comparação com mês anterior
- mini indicador de tendência

---

### Bloco 3 — KPIs secundários
Segunda linha com cards menores:
- contas fixas
- gastos variáveis
- parcelas futuras
- compras parceladas ativas
- média diária
- maior categoria do mês

Esses cards podem ser menores e mais compactos.

---

### Bloco 4 — Área analítica principal
Dividir em duas colunas.

#### Coluna esquerda (maior)
**Distribuição por categoria**
- usar donut chart ou bar chart horizontal;
- donut com no máximo 6 a 8 categorias + “Outros”;
- legenda organizada;
- percentual e valor.

#### Coluna direita
**Resumo executivo**
- maior categoria
- cartão mais usado
- próxima fatura crítica
- quantidade de lançamentos no mês
- compromisso futuro total

Esse bloco funciona como “insights rápidos”.

---

### Bloco 5 — Tendência temporal
Adicionar um gráfico de tendência para melhorar leitura executiva.

#### Gráfico recomendado
**Bar chart ou line chart de últimos 6 meses** com:
- total por ocorrência
- total por pagamento
- opcionalmente contas fixas vs variáveis

Isso dá muito mais utilidade ao dashboard do que apenas mostrar cards e um donut.

---

### Bloco 6 — Tabela resumida ou lista de atenção
Adicionar uma seção final com uma dessas opções:

#### Opção A — Próximos vencimentos
- próximas faturas
- contas fixas próximas
- itens pendentes

#### Opção B — Maiores gastos recentes
- lista dos 5 ou 10 maiores lançamentos recentes

#### Opção C — Alertas
- faturas acima de X% do limite
- categoria muito acima da média
- compra parcelada de alto impacto

---

## Composição visual recomendada do dashboard

### Exemplo de ordem
1. Header + filtros
2. KPIs principais
3. KPIs secundários
4. Gráfico de tendência + resumo lateral
5. Distribuição por categoria + lista lateral
6. Tabela de atenção/alertas

Isso melhora muito a leitura.

---

## KPI cards — padrão visual sugerido

Cada card de KPI deve ter:
- ícone pequeno em círculo suave;
- label curta;
- valor grande;
- linha auxiliar com contexto;
- eventual delta do mês anterior.

### Exemplo de estrutura
- topo: ícone + label
- meio: valor principal
- rodapé: `+12,3% vs mês anterior` ou `vence em 4 dias`

### Ícones sugeridos
- total do mês → wallet
- próxima fatura → credit-card
- comprometido → pie-chart
- gastos variáveis → receipt
- contas fixas → calendar-clock
- parceladas → layers

---

## Gráficos recomendados

### 1. Gráfico de categorias
**Preferência:** donut chart refinado

#### Regras
- usar no máximo 6 categorias + outros;
- usar tons análogos discretos;
- evitar arco-íris;
- mostrar valor e percentual;
- legenda externa e limpa.

### 2. Gráfico de evolução mensal
**Preferência:** barras verticais ou linha suave

#### Mostrar
- últimos 6 meses;
- gasto total por mês;
- comparação ocorrência vs pagamento opcional.

### 3. Gráfico de composição fixo vs variável
**Preferência:** stacked bar ou 2 barras comparativas

### 4. Gráfico por cartão
**Preferência:** barra horizontal
- total por cartão no mês;
- limite usado;
- saldo disponível.

---

## Paleta para gráficos
Como você não gosta de muita cor, use uma paleta controlada.

### Série principal de gráficos
- `#1F4B46`
- `#2D625B`
- `#4C7B74`
- `#6A958F`
- `#8CB1AA`
- `#B7D1CB`

### Série secundária neutra
- `#374151`
- `#4B5563`
- `#6B7280`
- `#9CA3AF`

### Regra
- usar verdes acinzentados para dados principais;
- usar cinzas para dados complementares;
- vermelho apenas para alertas;
- amarelo apenas para atenção.

---

## Melhorias específicas por tela

## 1. Navbar / topo
### Problemas
- simples demais;
- pouco destaque da navegação ativa;
- branding fraco.

### Melhorias
- topbar mais baixa e refinada;
- adicionar logo/monograma simples;
- item ativo com underline suave ou pill discreto;
- espaçamento horizontal maior entre grupos;
- possível uso de borda inferior suave + fundo translúcido.

### Sugestão visual
- fundo branco com `backdrop-blur` leve;
- borda inferior `border-slate-200/70`;
- item ativo com `bg-slate-100` ou `bg-primary/10`;
- tipografia medium na aba ativa.

---

## 2. Tela de Categorias
### Problemas
- tela com aparência de CRUD cru;
- tabela simples demais;
- criação e listagem sem composição visual.

### Melhorias
- usar layout 2 colunas em desktop:
  - esquerda: formulário de criação
  - direita: resumo/estatísticas rápidas
- transformar lista em card mais refinado;
- usar badge para tipo (`expense`, `income` futuramente);
- permitir busca local;
- usar ícones de categoria no futuro.

### Visual sugerido
- card “Nova categoria” menor;
- card “Lista de categorias” com header contendo busca e contador;
- linhas com hover e ação de excluir via menu contextual.

---

## 3. Tela de Contas fixas
### Problemas
- formulário extenso e com pouco agrupamento;
- lista funcional, mas sem destaque para tipo e situação.

### Melhorias
- separar formulário em seções:
  - dados principais
  - recorrência
  - comportamento do valor
- usar `Switch` em vez de checkbox simples para `valor variável`;
- destacar `ativa/inativa` com badge;
- usar coluna de categoria com badge;
- melhorar CTA “Gerar lançamentos do mês”.

### Sugestão de layout
1. card de criação
2. card de geração mensal
3. card da lista

No card da lista incluir no header:
- busca
- filtro por status
- filtro por tipo

---

## 4. Tela de Lançamentos / gastos variáveis
### Problemas
- tela muito vazia;
- sem resumo do mês;
- formulário parece isolado.

### Melhorias
- inserir mini resumo no topo:
  - total do mês
  - quantidade de lançamentos
  - categoria mais usada
- formulário pode ficar em card lateral ou drawer;
- tabela precisa de melhor densidade e estado vazio mais elegante.

### Recomendação
- header com seletor de mês + resumo rápido;
- abaixo, card com lista do mês;
- botão “Novo gasto” abre modal/drawer ao invés de ocupar muito espaço fixo.

---

## 5. Tela de Cartões
### Problemas
- visual funcional, mas sem percepção de “cartão”;
- tudo parece uma tabela simples.

### Melhorias
- mostrar cada cartão como card visual compacto;
- incluir nome, fechamento, vencimento, limite, uso atual;
- usar barra de progresso do limite usado;
- tabela pode continuar para administração, mas cards dão mais valor visual.

### Sugestão
No topo:
- grid de cards dos cartões

Abaixo:
- botão/adicionar novo cartão em dialog
- tabela administrativa detalhada

---

## 6. Tela de Compras no cartão
### Problemas
- tela longa demais;
- tabela muito pesada visualmente;
- preview de parcelas pouco destacado.

### Melhorias
- transformar cadastro em card mais rico;
- usar preview dinâmico da compra do lado direito;
- mostrar claramente:
  - fatura de entrada
  - vencimento estimado
  - valor da parcela
  - total de parcelas
- listar compras com filtros por cartão, período, categoria e tipo.

### Sugestão de layout
Topo em 2 colunas:
- esquerda: formulário
- direita: painel de preview

Abaixo:
- abas `Todas`, `À vista`, `Parceladas`
- tabela refinada com badges `À vista` / `3/12`

---

## 7. Tela de Faturas
### Problemas
- muito simples para uma tela importante;
- faltam total, status mais claro, progresso, resumo.

### Melhorias
- cada fatura pode aparecer como linha ou card expandível;
- mostrar total da fatura, vencimento, status, quantidade de compras;
- botão de detalhe deve abrir drawer lateral;
- botão pagar precisa ter mais clareza visual.

### Sugestão de conteúdo por linha/card
- referência
- valor total
- vencimento
- status
- compras na fatura
- % do limite do cartão
- ações

### Status visual
- `Aberta`
- `Fechada`
- `Paga`
- `Vencida`

Usar badges consistentes.

---

## UX e microinterações

### Regras recomendadas
- hover suave em cards e linhas clicáveis;
- transições curtas (`150ms` a `200ms`);
- feedback visual ao salvar;
- skeletons em carregamentos;
- toast notifications discretas;
- confirmação elegante para exclusões e pagamentos.

### Estados importantes
- loading
- empty
- success
- error
- disabled

Todos devem seguir o mesmo padrão visual.

---

## Dark mode
Mesmo que não seja prioridade, vale estruturar desde já para suportar dark mode depois.

### Estratégia
- usar tokens CSS ou variáveis do Tailwind;
- aproveitar o suporte do shadcn/ui;
- manter paleta neutra também no dark mode.

---

## Tokens visuais sugeridos

### Raio de borda
- cards principais: `16px`
- inputs e botões: `10px` ou `12px`
- badges: `999px`

### Sombra
- cards: sombra leve
- dropdowns/dialogs: sombra média
- evitar sombras pesadas

### Bordas
- 1px quase sempre;
- usar borda como estrutura principal e sombra apenas como apoio.

---

## Sugestão de tema Tailwind

### Semântica recomendada
Criar tokens semânticos em vez de espalhar hex pelo projeto:
- `background`
- `foreground`
- `card`
- `card-foreground`
- `muted`
- `muted-foreground`
- `border`
- `input`
- `primary`
- `primary-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `success`
- `warning`

---

## Recomendações de implementação visual

### Prioridade 1
1. aplicar Tailwind + shadcn/ui;
2. definir tokens de cor e tipografia;
3. padronizar App Shell;
4. refatorar dashboard;
5. criar componentes reutilizáveis:
   - `PageHeader`
   - `StatCard`
   - `SectionCard`
   - `EmptyState`
   - `DataTable`
   - `FormField`
   - `StatusBadge`

### Prioridade 2
6. melhorar formulários com grid e agrupamento;
7. refinar tabelas;
8. padronizar modais/dialogs;
9. melhorar estados vazios e loading.

### Prioridade 3
10. microinterações;
11. dark mode opcional;
12. refinamento de gráficos e resumos avançados.

---

## Estrutura de componentes sugerida

```txt
src/components/ui/
src/components/layout/
  app-shell.tsx
  topbar.tsx
  sidebar.tsx (se existir no futuro)

src/components/shared/
  page-header.tsx
  stat-card.tsx
  section-card.tsx
  status-badge.tsx
  money-value.tsx
  empty-state.tsx
  filter-bar.tsx

src/components/dashboard/
  dashboard-header.tsx
  primary-kpis.tsx
  secondary-kpis.tsx
  expense-category-chart.tsx
  monthly-trend-chart.tsx
  insights-panel.tsx
  upcoming-items.tsx
```

---

## Exemplo de redesign visual do dashboard

### Header
- Título forte
- Subtítulo curto
- Mês e modo de visão em linha
- Botão opcional de exportar no futuro

### Linha 1
- Total do mês
- Próxima fatura
- Faturas em aberto
- Comprometido

### Linha 2
- Contas fixas
- Gastos variáveis
- Parcelas futuras
- Compras parceladas ativas

### Linha 3
- gráfico de tendência (8 colunas)
- resumo executivo (4 colunas)

### Linha 4
- gráfico de categorias (8 colunas)
- top categorias / top cartões (4 colunas)

### Linha 5
- próximos vencimentos ou maiores gastos

---

## Diretriz final de design
A aplicação deve transmitir:
- organização;
- controle;
- clareza;
- confiança;
- sobriedade.

O redesign não deve buscar “efeito visual chamativo”.
Deve buscar **elegância, hierarquia, consistência e boa leitura financeira**.

---

## Prompt resumido para implementar o redesign no CursorAI

Use Tailwind CSS + shadcn/ui para refatorar visualmente o front-end do sistema Finanças AI. A estética deve ser minimalista, sóbria, elegante e profissional, com paleta neutra e apenas uma cor principal em verde escuro acinzentado. Evite interfaces muito coloridas. Refatore especialmente o dashboard, reorganizando as informações em blocos com hierarquia visual clara: header com filtros, KPIs principais, KPIs secundários, gráfico de tendência, gráfico de categorias e painel lateral de insights. Padronize cards, tabelas, formulários, badges e estados visuais. Crie componentes reutilizáveis como PageHeader, StatCard, SectionCard, StatusBadge, EmptyState e DataTable. Use Recharts para gráficos com paleta discreta. Melhore todas as telas (categorias, contas fixas, lançamentos, cartões, compras e faturas) para que pareçam um produto moderno e refinado, não apenas CRUDs simples.

