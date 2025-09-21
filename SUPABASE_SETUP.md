# Supabase Configuration for Claude Table Access

## Method 1: Service Role Key (Recommended for Development)

1. **Get your Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Find **Service role secret** (this has full database access)
   - Copy this key

2. **Add to your environment variables:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Update your Supabase client initialization:**
   ```typescript
   // For admin operations (table modifications)
   import { createClient } from '@supabase/supabase-js'

   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     }
   )
   ```

## Method 2: Enable RLS Policies

1. **Disable Row Level Security temporarily:**
   - Go to **Authentication** → **Policies**
   - Find the `case_detail` table (previously `defendants`)
   - Toggle OFF Row Level Security

2. **Or create a policy for full access:**
   ```sql
   -- Run this in SQL Editor
   CREATE POLICY "Enable all operations for authenticated users"
   ON case_detail
   FOR ALL
   USING (true)
   WITH CHECK (true);
   ```

## Method 3: Use Supabase Management API

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Now you can run migrations directly:**
   ```bash
   supabase db push
   ```

## For MCP Server Access (Claude)

To allow Claude's MCP server to modify tables:

1. **Set the access token in environment:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=your-service-role-key
   ```

2. **Or pass it when starting Claude:**
   ```bash
   claude --access-token your-service-role-key
   ```

## Security Warning

⚠️ **IMPORTANT**:
- Never commit service role keys to version control
- Use service role keys only in server-side code
- For production, use proper RLS policies instead of service role keys
- Consider using Supabase Edge Functions for sensitive operations

## To Rename the Table via API

Once configured, you can run:
```sql
ALTER TABLE defendants RENAME TO case_detail;
```

Through:
- Supabase Dashboard SQL Editor
- Supabase CLI: `supabase db execute`
- Or via the migration scripts with proper auth