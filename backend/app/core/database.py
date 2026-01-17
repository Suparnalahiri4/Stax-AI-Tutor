# ABOUTME: Supabase database client initialization and management
# ABOUTME: Provides both anonymous and service role clients for different use cases

from supabase import create_client, Client
from .config import get_settings

settings = get_settings()

# Client for authenticated user operations (uses anon key + user JWT)
supabase_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key
)

# Client for admin operations (bypasses RLS)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)


def get_supabase() -> Client:
    """Get the Supabase client for user operations."""
    return supabase_client


def get_supabase_admin() -> Client:
    """Get the Supabase admin client for service operations."""
    return supabase_admin
