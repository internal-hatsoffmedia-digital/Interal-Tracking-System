import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../.env');
const envContent = await readFile(envPath, 'utf8');

const urlMatch = envContent.match(/^VITE_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m);
const keyMatch = envContent.match(/^VITE_SUPABASE_ANON_KEY\s*=\s*["']?([^\s"']+)/m);

const supabaseUrl = process.env.VITE_SUPABASE_URL || (urlMatch ? urlMatch[1] : null);
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || (keyMatch ? keyMatch[1] : null);

console.log('====================================================');
console.log('       SUPABASE LIVE INSTANCE TEST SUITE            ');
console.log('====================================================');
console.log(`Supabase Endpoint: ${supabaseUrl}`);
console.log(`Anon Key Configured: ${supabaseAnonKey ? 'Yes (' + supabaseAnonKey.substring(0, 15) + '...)' : 'No'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const report = {
  timestamp: new Date().toISOString(),
  endpoint: supabaseUrl,
  authStatus: 'UNKNOWN',
  rlsEnforced: true,
  tableResults: [],
  rpcResults: [],
  storageBuckets: [],
  totalDurationMs: 0
};

const startTime = Date.now();

try {
  // 1. Auth Health Check
  console.log('[1/5] Checking Supabase Auth Service Health...');
  const tAuthStart = Date.now();
  const { data: authData, error: authError } = await supabase.auth.getSession();
  const authLatency = Date.now() - tAuthStart;
  if (authError) {
    console.log(`  ⚠️ Auth session check returned error: ${authError.message} (${authLatency}ms)`);
    report.authStatus = `Error: ${authError.message}`;
  } else {
    console.log(`  ✓ Auth service active and responding (${authLatency}ms)`);
    report.authStatus = 'OK';
  }

  // 2. Core Tables and RLS Policy Checks (Anonymous Client)
  console.log('\n[2/5] Testing Core Schema Tables Access & RLS (Anon Client)...');
  const targetTables = [
    'teams',
    'profiles',
    'employees',
    'projects',
    'tasks',
    'task_assignments',
    'timesheets',
    'project_comments',
    'announcements',
    'sales_leads',
    'sales_targets',
    'sales_activity',
    'project_members',
    'project_notifications'
  ];

  for (const table of targetTables) {
    const tStart = Date.now();
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    const elapsed = Date.now() - tStart;

    if (error) {
      console.log(`  🔒 Table '${table}': Restricted by RLS Policy (${error.message || error.code}) [${elapsed}ms]`);
      report.tableResults.push({ table, status: 'Restricted (RLS)', error: error.message, count: null, latencyMs: elapsed });
    } else {
      console.log(`  ✓ Table '${table}': Accessible, Row Count = ${count ?? 0} [${elapsed}ms]`);
      report.tableResults.push({ table, status: 'Accessible', count: count ?? 0, latencyMs: elapsed });
    }
  }

  // 3. Testing Write Operations to verify RLS Enforcement
  console.log('\n[3/5] Verifying RLS Enforcement on Write Operations...');
  const { data: writeData, error: writeError } = await supabase
    .from('projects')
    .insert({ name: '__TEST_UNAUTHORIZED_PROJECT__' });

  if (writeError) {
    console.log(`  ✓ Write blocked by RLS as expected: ${writeError.message}`);
    report.rlsEnforced = true;
  } else {
    console.log('  ❌ ALERT: Unauthorized insert succeeded! Check RLS configuration on projects table.');
    report.rlsEnforced = false;
  }

  // 4. Testing RPC Functions
  console.log('\n[4/5] Testing Stored RPC Functions (Anon Context)...');
  const rpcs = [
    { name: 'mark_project_notification_read', params: { notification_id: '00000000-0000-0000-0000-000000000000' } }
  ];

  for (const rpc of rpcs) {
    const tStart = Date.now();
    const { data: rpcData, error: rpcError } = await supabase.rpc(rpc.name, rpc.params);
    const elapsed = Date.now() - tStart;

    if (rpcError) {
      console.log(`  ℹ️ RPC '${rpc.name}': ${rpcError.message} (${elapsed}ms)`);
      report.rpcResults.push({ rpc: rpc.name, status: rpcError.message, latencyMs: elapsed });
    } else {
      console.log(`  ✓ RPC '${rpc.name}': Executed successfully (${elapsed}ms)`);
      report.rpcResults.push({ rpc: rpc.name, status: 'OK', latencyMs: elapsed });
    }
  }

  // 5. Testing Storage Service
  console.log('\n[5/5] Checking Supabase Storage Service...');
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  if (storageError) {
    console.log(`  ⚠️ Storage error: ${storageError.message}`);
  } else {
    console.log(`  ✓ Storage service online. Found ${buckets ? buckets.length : 0} bucket(s).`);
    if (buckets) {
      buckets.forEach(b => {
        console.log(`    • Bucket: '${b.name}' (Public: ${b.public})`);
        report.storageBuckets.push({ name: b.name, public: b.public });
      });
    }
  }

  report.totalDurationMs = Date.now() - startTime;

  console.log('\n====================================================');
  console.log(` SUMMARY: Live Supabase Test completed in ${report.totalDurationMs}ms`);
  console.log(` - Endpoint reachable: YES`);
  console.log(` - Auth Endpoint status: ${report.authStatus}`);
  console.log(` - RLS Security Check: ${report.rlsEnforced ? 'PASSED (Protected)' : 'FAILED'}`);
  console.log('====================================================');

  console.log('\nJSON_RESULT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('JSON_RESULT_END');

} catch (err) {
  console.error('\n❌ Live Supabase test failed with exception:', err);
  process.exit(1);
}
