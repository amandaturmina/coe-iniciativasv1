-- ============================================================
-- COE Atrio — Setup completo do banco de dados no Supabase
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- TABELA: profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  nome text not null,
  email text not null unique,
  perfil text check (perfil in ('colaborador','gestor','lideranca')) default 'colaborador',
  area text,
  created_at timestamptz default now()
);

-- TABELA: iniciativas
create table if not exists iniciativas (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique not null,

  -- SEÇÃO 1: Identificação
  titulo text not null,
  area text not null,
  tipo_iniciativa text check (tipo_iniciativa in ('Setorial','Intersetorial','Cross-company')),
  patrocinador text not null,
  responsavel_nome text not null,
  responsavel_email text not null,

  -- SEÇÃO 2: Problema e Valor
  problema text not null,
  valor_esperado text not null,
  beneficiarios text[],

  -- SEÇÃO 3: Custos
  custo_estimado numeric(12,2),
  detalhamento_custos text,

  -- SEÇÃO 4: Escopo e Entregas
  entregas text not null,
  fora_escopo text,

  -- SEÇÃO 5: Cronograma
  data_inicio_prevista date,
  data_fim_prevista date,
  dependencias text,

  -- SEÇÃO 6: Recursos
  equipe text,
  tem_terceiros boolean default false,
  terceiros text,

  -- SEÇÃO 7: Riscos
  riscos jsonb default '[]',

  -- SEÇÃO 8: EAP
  eap text,

  -- SEÇÃO 9: Anexos
  anexos text[] default '{}',

  -- GESTÃO
  status text check (status in (
    'Recebida','Em análise','Aprovada','Recusada','Aguardar ciclo',
    'Em planejamento','Em andamento','Concluída','Pausada'
  )) default 'Recebida',
  score numeric(4,2) default 0,
  decisao text check (decisao in ('Aprovada','Recusada','Aguardar ciclo')),
  justificativa text,
  responsavel_execucao text,
  previsao_inicio date,
  data_decisao timestamptz,
  roi_estimado numeric(12,2),
  roi_realizado numeric(12,2),
  scorecard jsonb default '{}',

  submetido_por uuid references profiles(id),
  decidido_por uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table profiles enable row level security;
alter table iniciativas enable row level security;

-- Perfil próprio: cada usuário vê/edita só o próprio
create policy "perfil proprio" on profiles
  for all using (auth.uid() = id);

-- Colaborador vê as suas; gestor e liderança veem todas
create policy "colaborador ve suas" on iniciativas
  for select using (
    submetido_por = auth.uid() or
    (select perfil from profiles where id = auth.uid()) in ('gestor','lideranca')
  );

-- Colaborador insere (apenas o próprio)
create policy "colaborador insere" on iniciativas
  for insert with check (submetido_por = auth.uid());

-- Gestor atualiza
create policy "gestor atualiza" on iniciativas
  for update using (
    (select perfil from profiles where id = auth.uid()) = 'gestor'
  );

-- ============================================================
-- TRIGGER: criar profile automaticamente no primeiro login
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- STORAGE: criar bucket para anexos
-- ============================================================
-- Execute no painel do Supabase: Storage > New Bucket
-- Nome: iniciativas | Public: NÃO | File size limit: 10MB
-- Ou via SQL:
insert into storage.buckets (id, name, public, file_size_limit)
values ('iniciativas', 'iniciativas', false, 10485760)
on conflict (id) do nothing;

-- Política de storage: autenticados podem fazer upload
create policy "upload autenticado" on storage.objects
  for insert with check (
    bucket_id = 'iniciativas' and auth.uid() is not null
  );

create policy "leitura autenticada" on storage.objects
  for select using (
    bucket_id = 'iniciativas' and auth.uid() is not null
  );

-- ============================================================
-- PARA DEFINIR PERFIL DE GESTOR/LIDERANÇA:
-- Altere manualmente via SQL após o primeiro login do usuário:
-- UPDATE profiles SET perfil = 'gestor' WHERE email = 'gestor@atriohoteis.com.br';
-- UPDATE profiles SET perfil = 'lideranca' WHERE email = 'lider@atriohoteis.com.br';
-- ============================================================
