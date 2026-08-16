# Corrigir deploy e criar gerenciamento robusto do PWA

## Objetivo
Eliminar o erro `Could not resolve entry module "index.html"` na Vercel e transformar a área **App (PWA)** em uma central confiável de publicação, validação, acompanhamento e rollback de versões.

## Implementação

### 1. Corrigir o build para Vercel
- Configurar a Vercel como aplicação TanStack Start/Nitro full-stack, sem preset de site Vite estático e sem depender de `index.html`.
- Preservar o build atual usado pelo preview/Lovable e selecionar o preset Vercel somente no ambiente da Vercel.
- Remover referências conflitantes ao manifest estático; o endpoint dinâmico será a fonte única do manifest.

### 2. Modelo de versões e assets
- Criar tabelas protegidas para:
  - versões imutáveis do PWA, contendo snapshot do manifest, lista de assets, versão do service worker, autor, data e status;
  - registros anônimos de instalações, contendo somente um identificador aleatório, versão aplicada e último contato.
- Manter cada conjunto de ícones/splash em caminhos versionados e imutáveis no Storage, para que versões anteriores continuem disponíveis.
- Ao publicar, salvar um snapshot antes de ativar a nova versão. Ao reverter, restaurar manifest e referências dos assets da versão escolhida e publicar uma nova versão de service worker para distribuir o rollback com segurança.

### 3. Manifest e service worker consistentes
- Gerar o manifest a partir da versão ativa, incluindo exatamente os assets publicados naquela versão.
- Gerar/servir os metadados do service worker com a mesma versão ativa e fazer o worker armazenar apenas URLs válidas.
- Adicionar uma verificação cruzada no admin entre manifest, assets registrados, respostas HTTP e versão ativa do worker.
- Bloquear a publicação quando houver arquivo obrigatório ausente ou com dimensão/formato inválido; alertas não críticos continuarão visíveis sem bloquear.

### 4. Upload multi-resolução
- Criar um componente de upload em lote para favicon, ícones e splash screens.
- Validar antes do envio: tipo PNG/ICO compatível, dimensão exata da posição, limite de tamanho e duplicidade.
- Exibir prévia e estado individual (válido, inválido, enviando, publicado) para cada resolução.
- Enviar somente arquivos aprovados para uma pasta da nova versão e salvar URL, dimensão, MIME e tamanho no snapshot.

### 5. Painel de status e métricas
- Exibir versão ativa do manifest, versão do service worker, integridade dos assets e estado da solicitação de atualização.
- Registrar, sem dados pessoais, quando uma instalação carregar/aplicar uma versão.
- Mostrar quantidade de instalações vistas, atualizadas e pendentes, além da data do último recebimento. A contagem será estimada por instalações que abriram o app após a publicação; navegadores offline não podem confirmar atualização até reconectarem.

### 6. Histórico e rollback
- Listar versões com data, autor, quantidade de assets, integridade e observação.
- Permitir inspecionar o snapshot e reverter com diálogo de confirmação.
- Registrar publicação e rollback no log de auditoria existente.

## Segurança e acesso
- Somente administradores poderão criar, publicar ou reverter versões e consultar métricas agregadas.
- O endpoint público de telemetria aceitará apenas UUID anônimo e versões numéricas, sem nome, e-mail, IP armazenado ou outros dados pessoais.
- Novas tabelas terão grants e RLS explícitos; uploads continuarão no bucket de assets já existente, em caminhos versionados.

## Validação final
- Verificar build TanStack Start e saída compatível com Vercel, sem busca por `index.html`.
- Testar manifest, worker, publicação, asset ausente, upload inválido, adoção de versão e rollback.
- Conferir visualmente o painel administrativo em desktop e mobile e confirmar que o preview não registra service worker.
