---
description: Execute a SQL query against the live Supabase database and return results
allowed-tools: mcp__b01db5d4-05bd-402c-9240-04b533de9da4__execute_sql, mcp__b01db5d4-05bd-402c-9240-04b533de9da4__list_tables
argument-hint: "SQL query or 'list tables' or 'schema <table_name>'"
---

Query the live Supabase database.

Query: $ARGUMENTS

Steps:

1. If $ARGUMENTS is "list tables" — call `list_tables` and display all table names.

2. If $ARGUMENTS starts with "schema " — run:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = '<table>'
   ORDER BY ordinal_position;
   ```

3. Otherwise — execute $ARGUMENTS directly as SQL using `execute_sql`.

4. Present results in a readable table format.

5. If the query is a mutation (INSERT/UPDATE/DELETE), warn the user that this affects the live production database and confirm before running.

Note: All tables have RLS. Queries here bypass RLS (service role context). Results show all rows across all users.
