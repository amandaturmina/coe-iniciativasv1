# COE Atrio — Instruções de Setup e Deploy

## 1. Pré-requisitos

- **Node.js 18+** — Baixe em: https://nodejs.org (versão LTS)
- Conta no **Supabase** — https://supabase.com
- Conta no **Resend** — https://resend.com (para e-mails)
- Conta no **Vercel** — https://vercel.com (para deploy)

---

## 2. Instalar dependências (após instalar Node.js)

Abra o PowerShell, navegue até a pasta do projeto e rode:

```powershell
cd "C:\Users\amanda.turmina\Desktop\coe-iniciativas"
npm install
```

---

## 3. Configurar Supabase

1. Crie um novo projeto em https://supabase.com
2. Vá em **SQL Editor** e cole e execute o conteúdo do arquivo `supabase-setup.sql`
3. Vá em **Authentication > Providers** e habilite **Email** (Magic Link)
4. Em **Project Settings > API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 4. Configurar Resend (e-mails)

1. Crie conta em https://resend.com
2. Gere uma API Key
3. Coloque em `RESEND_API_KEY`
4. Configure o domínio `atriohoteis.com.br` no painel do Resend (ou use o domínio sandbox para testes)

---

## 5. Preencher o .env.local

Edite o arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_GESTOR=gestor@atriohoteis.com.br
```

---

## 6. Rodar localmente

```powershell
npm run dev
```

Acesse: http://localhost:3000

---

## 7. Deploy na Vercel

```powershell
# Inicializar git
git init
git add .
git commit -m "feat: sistema COE Atrio - versao inicial completa"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/[seu-usuario]/coe-iniciativas.git
git push -u origin main
```

Depois:
1. Acesse https://vercel.com e importe o repositório
2. Adicione todas as variáveis de ambiente (as mesmas do `.env.local`)
3. Altere `NEXT_PUBLIC_APP_URL` para a URL da Vercel (ex: `https://coe-atrio.vercel.app`)
4. Deploy!

---

## 8. Definir perfis de usuário no Supabase

Após o primeiro login dos usuários, execute no SQL Editor do Supabase:

```sql
-- Promover alguém a gestor
UPDATE profiles SET perfil = 'gestor' WHERE email = 'gestor@atriohoteis.com.br';

-- Promover a liderança
UPDATE profiles SET perfil = 'lideranca' WHERE email = 'diretor@atriohoteis.com.br';
```

---

## 9. Estrutura de perfis

| Perfil | Pode submeter | Fila de análise | Scorecard/Decisão | Kanban | Relatórios |
|--------|:---:|:---:|:---:|:---:|:---:|
| colaborador | ✅ | ❌ | ❌ | ❌ | ❌ |
| gestor | ✅ | ✅ | ✅ | ✅ | ✅ |
| lideranca | ✅ | ❌ | ❌ | ✅ (leitura) | ✅ |

---

## 10. Problemas comuns

**"Supabase URL not found"** → Verifique o `.env.local`

**E-mails não chegam** → Verifique a API Key do Resend e o domínio configurado

**Permissão negada no banco** → Verifique as policies RLS no Supabase e se o SQL foi executado completamente

**Uploads não funcionam** → Verifique se o bucket `iniciativas` foi criado e as policies de storage
