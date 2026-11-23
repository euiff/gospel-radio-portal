# Atualizações pelo painel administrativo

A interface está em `/admin/atualizacoes` e a API protegida em `/api/admin/updates`.

## Funcionamento
1. Administrador autenticado no Supabase consulta o último commit da branch `main`.
2. O servidor, **nunca o navegador**, utiliza `GITHUB_UPDATER_TOKEN` para ler o repositório privado.
3. Ao clicar **Atualizar sistema**, o servidor aciona o Deploy Hook da Vercel previamente configurado.
4. A resposta informa apenas que a **implantação foi solicitada**. Consulte o painel da Vercel para confirmar conclusão/erros.

## Configuração obrigatória no servidor
- `GITHUB_UPDATER_TOKEN`: token GitHub com acesso de leitura de conteúdo apenas a `euiff/gospel-radio-portal`.
- `VERCEL_DEPLOY_HOOK_URL`: URL HTTPS de Deploy Hook criada no projeto Vercel, apontando para a branch `main`.
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`: variáveis já utilizadas no projeto para validar usuários.

**Nunca publique as variáveis, URLs de hook ou tokens no código, no navegador ou no repositório.**

## Hospedagem cPanel
O repositório é um aplicativo TanStack Start com renderização no servidor. Não é seguro simplesmente copiar os arquivos TypeScript ou um ZIP do GitHub para `public_html`. Para hospedar no cPanel é necessário verificar suporte ao runtime Node.js, build, variáveis do servidor, redirecionamento e estratégia de publicação. A implementação atual do botão aciona **somente a Vercel**, não o cPanel.

## Segurança e manutenção
- A API valida o token de sessão Supabase e o papel `admin` do banco no servidor.
- O Deploy Hook só é chamado pelo backend, e somente para o host e caminho esperados da Vercel.
- Configure proteção de branch, revise alterações antes de promover `main` e mantenha backup do banco Supabase independentemente do deploy.
- Não considere implantação concluída apenas pela resposta HTTP 202.
- O repositório contém um arquivo `.env` versionado. Audite se contém segredos reais, remova-os do histórico e rotacione-os quando necessário.

## Testes após integração
1. Entrar como administrador e acessar `/admin/atualizacoes`.
2. Clicar **Verificar atualizações** e confirmar commit e mensagem.
3. Com hook configurado, clicar **Atualizar sistema**, conferir o deploy no painel Vercel e testar a versão pública.
4. Confirmar que uma conta sem a função admin não consegue consultar nem acionar a API.
