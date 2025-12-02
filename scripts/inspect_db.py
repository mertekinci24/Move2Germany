
import os
from supabase import create_client, Client

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.")
    exit(1)

supabase: Client = create_client(url, key)

try:
    # Try to select a single row to see the structure, or use rpc if available (but we don't have inspection rpc)
    # We'll try to insert a dummy note with event_date to see the error, or just select * limit 1
    print("Inspecting 'notes' table...")
    response = supabase.table("notes").select("*").limit(1).execute()
    print("Select success.")
    if response.data:
        print("Columns found in data:", response.data[0].keys())
    else:
        print("Table is empty, cannot infer columns from data.")
        
        # Try to insert with event_date to force error if missing
        print("Attempting dry-run insert with event_date...")
        try:
            supabase.table("notes").insert({
                "user_id": "00000000-0000-0000-0000-000000000000", # Dummy UUID
                "title": "Test",
                "content": "Test",
                "event_date": "2025-01-01T10:00:00Z"
            }).execute()
        except Exception as e:
            print(f"Insert failed as expected (or unexpected): {e}")

except Exception as e:
    print(f"Error accessing 'notes' table: {e}")
