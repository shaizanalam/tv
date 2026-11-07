-- DriveFrame TV: Initial Database Migration
-- Target: Supabase PostgreSQL 15+

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('owner', 'family');
create type member_status as enum ('pending', 'approved', 'revoked');
create type device_type as enum ('tv', 'browser', 'mobile');
create type pairing_status as enum ('pending', 'paired', 'expired');
create type slideshow_fit as enum ('cover', 'contain', 'smart_fill');
create type transition_style as enum ('fade', 'crossfade', 'slide', 'ken_burns');

-- 1. Profiles Table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Family Members Table
create table public.family_members (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade,
    invited_email text not null,
    role user_role default 'family'::user_role not null,
    status member_status default 'pending'::member_status not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(owner_id, invited_email)
);

-- 3. Google Drive Connections (Token Vault)
create table public.drive_connections (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null unique,
    encrypted_access_token text not null,
    encrypted_refresh_token text not null,
    token_iv text not null,
    token_tag text not null,
    token_expiry timestamp with time zone not null,
    drive_user_email text not null,
    root_folder_id text default 'root' not null,
    sync_status text default 'idle' not null,
    last_synced_at timestamp with time zone,
    sync_error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Drive Items (Normalized File & Folder Hierarchy)
create table public.drive_items (
    id uuid default uuid_generate_v4() primary key,
    file_id text not null,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    mime_type text not null,
    parent_id text,
    size bigint default 0,
    drive_created_time timestamp with time zone,
    drive_modified_time timestamp with time zone,
    thumbnail_link text,
    width integer,
    height integer,
    is_folder boolean default false not null,
    trashed boolean default false not null,
    metadata_json jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(owner_id, file_id)
);

-- 5. Curated Albums
create table public.albums (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    folder_id text not null,
    title text not null,
    description text,
    cover_file_id text,
    photo_count integer default 0 not null,
    is_hidden boolean default false not null,
    custom_order integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(owner_id, folder_id)
);

-- 6. Favorites Table
create table public.favorites (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    file_id text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, file_id)
);

-- 7. TV & Client Devices
create table public.devices (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    paired_by_user_id uuid references public.profiles(id) on delete set null,
    device_identifier text not null unique,
    device_name text not null,
    device_type device_type default 'tv'::device_type not null,
    ip_address text,
    user_agent text,
    is_authorized boolean default true not null,
    device_token_hash text not null,
    last_active_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Device Pairings (Temporary 6-Digit Handshake)
create table public.device_pairings (
    id uuid default uuid_generate_v4() primary key,
    pairing_code text not null unique,
    device_identifier text not null,
    device_name text default 'Smart TV / JioSphere' not null,
    status pairing_status default 'pending'::pairing_status not null,
    owner_id uuid references public.profiles(id) on delete cascade,
    paired_user_id uuid references public.profiles(id) on delete set null,
    device_session_token text,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. User & Slideshow Settings
create table public.user_settings (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    slideshow_duration integer default 8 not null,
    slideshow_transition transition_style default 'crossfade'::transition_style not null,
    slideshow_shuffle boolean default false not null,
    slideshow_fit slideshow_fit default 'cover'::slideshow_fit not null,
    ambient_clock_enabled boolean default true not null,
    ambient_metadata_enabled boolean default true not null,
    ambient_weather_enabled boolean default false not null,
    ken_burns_intensity real default 1.15 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_drive_items_parent on public.drive_items(owner_id, parent_id) where not trashed;
create index idx_drive_items_folder on public.drive_items(owner_id, is_folder) where not trashed;
create index idx_drive_items_file on public.drive_items(file_id);
create index idx_device_pairings_code on public.device_pairings(pairing_code) where status = 'pending';
create index idx_family_members_user on public.family_members(user_id, status);
create index idx_favorites_user on public.favorites(user_id);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.drive_connections enable row level security;
alter table public.drive_items enable row level security;
alter table public.albums enable row level security;
alter table public.favorites enable row level security;
alter table public.devices enable row level security;
alter table public.device_pairings enable row level security;
alter table public.user_settings enable row level security;

-- Helper function: Check if caller is approved family member or owner
create or replace function public.is_authorized_viewer(target_owner_id uuid)
returns boolean security definer as $$
begin
    return (
        auth.uid() = target_owner_id
        or exists (
            select 1 from public.family_members fm
            where fm.owner_id = target_owner_id
              and fm.user_id = auth.uid()
              and fm.status = 'approved'
        )
    );
end;
$$ language plpgsql;

-- Profile Policies
create policy "Users read own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
    for update using (auth.uid() = id);

-- Drive Items Policies
create policy "Authorized users read drive items" on public.drive_items
    for select using (public.is_authorized_viewer(owner_id) and not trashed);

create policy "Owner manages drive items" on public.drive_items
    for all using (auth.uid() = owner_id);

-- Albums Policies
create policy "Authorized users read albums" on public.albums
    for select using (public.is_authorized_viewer(owner_id) and not is_hidden);

create policy "Owner manages albums" on public.albums
    for all using (auth.uid() = owner_id);

-- Favorites Policies
create policy "Users manage own favorites" on public.favorites
    for all using (auth.uid() = user_id);

-- Drive Connections (Restricted strictly to Owner)
create policy "Only owner accesses drive connection" on public.drive_connections
    for all using (auth.uid() = owner_id);

-- Device Pairings Policies
create policy "Public pair check" on public.device_pairings
    for select using (true);

create policy "Authenticated users update pairings" on public.device_pairings
    for update using (auth.role() = 'authenticated');

