# Provision employee accounts and Web Runners

The admin UI now names Vijay's team Web Runners. Real database changes require the trusted server-side provisioning script; no live accounts have been created by this task.

The script reads the actual employee directory and previews every account. New emails use the first name in lowercase at hatsoffmedia.in (Vijay uses the explicitly requested vijayr@hatsoffmedia.in), and new passwords use the first name with its first letter capitalized followed by 41@. No passwords are printed or written to a file. Existing linked Auth accounts retain their email/password. Inactive employees remain inactive; newly created inactive Auth accounts are banned.

Nadeem and Snega become employees of Web Runners. Vijay becomes its Associate Lead and team lead. If Web Runners does not exist, a single existing Web Development team is renamed, preserving its references; otherwise Web Runners is created. No other teams are merged. Other employees retain recorded teams; new accounts receive the roles previously specified for named leads/coordinators, otherwise Employee. Review the preview before applying.

Run from the project folder in a trusted PowerShell terminal. The service-role key is available to a Supabase project administrator. Never put it in frontend VITE variables, commit it or paste it into chat.

```powershell
$secureKey = Read-Host 'Supabase service-role key' -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new('', $secureKey).Password
node scripts/provision-employee-accounts.mjs
```

Review the preview, then execute:

```powershell
try {
  node scripts/provision-employee-accounts.mjs --apply
} finally {
  Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
  Remove-Variable secureKey -ErrorAction SilentlyContinue
}
```

If you stop after preview, remove the environment variable with the same Remove-Item command.

Duplicate first names, unknown linked accounts, conflicting email ownership or ambiguous Web team names stop preflight without changes. Missing Nadeem/Snega/Vijay employee entries must be verified/added in Employees first. The script never invents directory entries. API operations are not a single transaction; if provisioning stops partway, successful users remain. New Auth users carry a trusted employee ID in app metadata so a retry can finish linking without resetting passwords. No email invitations are sent.
