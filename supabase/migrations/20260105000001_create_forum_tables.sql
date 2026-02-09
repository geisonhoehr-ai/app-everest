-- Create tables
create table if not exists public.forum_categories (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  slug text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint forum_categories_pkey primary key (id),
  constraint forum_categories_slug_key unique (slug)
);

create table if not exists public.forum_topics (
  id uuid not null default gen_random_uuid(),
  title text not null,
  content text not null,
  category_id uuid references public.forum_categories(id),
  user_id uuid references public.users(id) not null,
  is_pinned boolean default false,
  is_locked boolean default false,
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint forum_topics_pkey primary key (id)
);

create table if not exists public.forum_posts (
  id uuid not null default gen_random_uuid(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint forum_posts_pkey primary key (id)
);

-- Toggle RLS
alter table public.forum_categories enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_posts enable row level security;

-- Policies
create policy "Categories are viewable by everyone" 
  on public.forum_categories for select using (true);

create policy "Topics are viewable by everyone" 
  on public.forum_topics for select using (true);

create policy "Posts are viewable by everyone" 
  on public.forum_posts for select using (true);

create policy "Authenticated users can create topics" 
  on public.forum_topics for insert with check (auth.uid() = user_id);

create policy "Users can update their own topics" 
  on public.forum_topics for update using (auth.uid() = user_id);

create policy "Authenticated users can create posts" 
  on public.forum_posts for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" 
  on public.forum_posts for update using (auth.uid() = user_id);

-- Insert default categories if they don't exist
insert into public.forum_categories (name, slug, description)
select 'Geral', 'geral', 'Discussões gerais sobre o curso'
where not exists (select 1 from public.forum_categories where slug = 'geral');

insert into public.forum_categories (name, slug, description)
select 'Dúvidas', 'duvidas', 'Tire suas dúvidas sobre as matérias'
where not exists (select 1 from public.forum_categories where slug = 'duvidas');

insert into public.forum_categories (name, slug, description)
select 'Sugestões', 'sugestoes', 'Sugestões para a plataforma e feedback'
where not exists (select 1 from public.forum_categories where slug = 'sugestoes');
