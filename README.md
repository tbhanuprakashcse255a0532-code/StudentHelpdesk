# Student Helpdesk — Plan → Code → Build

A college helpdesk prototype: React frontend, Express API, MySQL storage and a Python keyword-based assistant.
This repository supports four contributors and Jenkins automation for **Plan, Code, Build**.
It does not deploy the application or provision Jenkins/GitHub accounts automatically.

## Requirements

- Git and a GitHub account for each of the four members.
- Node.js 24.x at least 24.7, or a newer compatible version (local verification used Node 25.6.1).
  Built-in Argon2 is required. Run `node scripts/check-runtime.cjs`.
- npm bundled with Node.
- MySQL 8 and a database administrator for initial setup.
- Python 3 with pip. The current API invokes `py` on Windows and `python3` on Linux.
- Jenkins controller with a supported Java runtime, plus a Windows or Linux build agent
  with Git, Node and npm on the Jenkins service account's PATH.
  Consult the Java support policy for your chosen Jenkins version.

## Repository layout

```text
.github/                 issue and pull-request templates
Backend/                 Express API, authentication, account and migration scripts
  uploads/               local files; ignored except .gitkeep
database/schema.sql      EMPTY database initialization, no real data or passwords
frontend/                React source, public assets, package lock
scripts/                 runtime and repository checks
docs/PLAN.md             three stages, roles, evidence and acceptance criteria
Jenkinsfile              Plan → Code → Build pipeline
README.md                installation, teamwork and Jenkins instructions
```

## 1. Clone and install

Replace OWNER and REPOSITORY with your repository details:
```sh
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
node scripts/check-runtime.cjs
npm ci --prefix Backend
npm ci --prefix frontend
```
Always commit both package-lock.json files when changing dependencies. Use npm ci for a clean reproducible install.

Windows PowerShell:
```powershell
Copy-Item Backend/.env.example Backend/.env
Copy-Item frontend/.env.example frontend/.env
py -m pip install -r Backend/requirements.txt
```

Linux/macOS:
```sh
cp Backend/.env.example Backend/.env
cp frontend/.env.example frontend/.env
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r Backend/requirements.txt
```
Keep the virtual environment active when starting the backend on Linux/macOS so its child Python process can use it.

## 2. Create a fresh local database

Each teammate should use their own local database. Git does not copy your MySQL data.
Using MySQL Workbench or the mysql client as a database administrator:
```sql
CREATE DATABASE s_helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'helpdesk_app'@'localhost' IDENTIFIED BY 'CHOOSE_A_PRIVATE_DATABASE_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON s_helpdesk.* TO 'helpdesk_app'@'localhost';
USE s_helpdesk;
SOURCE D:/path/to/REPOSITORY/database/schema.sql;
```
SOURCE is a mysql CLI command. In Workbench, open schema.sql, select s_helpdesk, and execute it.
Use your actual path. The application currently creates its session table on startup, hence CREATE permission.
Use the administrator for schema import and any schema migrations.
**Do not import schema.sql into the existing working database.** It is for empty databases, not an upgrade script.

Edit Backend/.env:
```dotenv
DB_HOST=localhost
DB_USER=helpdesk_app
DB_PASSWORD=YOUR_PRIVATE_DATABASE_PASSWORD
DB_NAME=s_helpdesk
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```
Edit frontend/.env:
```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000
```
Frontend environment variables are public build-time values: never put secrets there.
Restart the frontend after changing its environment.

For a legacy database only: back up your database privately, use a migration-capable DB user,
then run `npm run migrate:passwords` from Backend. It changes schema, hashes legacy passwords,
clears plaintext and adds a registration uniqueness constraint. Duplicate registrations require
manual review if that constraint fails. It is not run in Jenkins.

## 3. Create personal application accounts

GitHub collaborator accounts and application login accounts are separate.
Create a separate application account for each person who needs it.
No default credentials or real database data are committed.

From Backend in PowerShell:
```powershell
$env:ACCOUNT_ROLE = 'admin'
$env:ACCOUNT_EMAIL = 'your-admin@example.com'
$secret = Read-Host 'Choose a password of at least 12 characters' -AsSecureString
$env:ACCOUNT_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
node create-account.js
Remove-Item Env:ACCOUNT_PASSWORD
```

For a student set these before running the same script:
```powershell
$env:ACCOUNT_ROLE = 'student'
$env:ACCOUNT_EMAIL = 'your-student@example.com'
$env:ACCOUNT_NAME = 'Student Name'
$env:ACCOUNT_BRANCH = 'CSE'
$env:ACCOUNT_PIN = 'YOUR_UNIQUE_PIN'
```
Set ACCOUNT_PASSWORD again using the hidden prompt, run the script, then clear it.
The script creates accounts; duplicate email errors do not overwrite existing accounts.

Bash equivalent:
```bash
cd Backend
export ACCOUNT_ROLE=admin ACCOUNT_EMAIL=your-admin@example.com
read -rs -p "Password (12+ characters): " ACCOUNT_PASSWORD
export ACCOUNT_PASSWORD
node create-account.js
unset ACCOUNT_PASSWORD
```
For students also export ACCOUNT_NAME, ACCOUNT_BRANCH and ACCOUNT_PIN.
Keep passwords private; do not include them in issues, commits or screenshots.

## 4. Run locally

Terminal 1:
```sh
cd Backend
npm start
```
Terminal 2:
```sh
cd frontend
npm start
```
Open http://localhost:3000. Backend: http://localhost:5000.
Student login requires email, password, branch and PIN matching its database record.
Admin login needs email and password. Sessions use HTTP-only cookies.

Stop each server with Ctrl+C. Avoid running a second backend on port 5000.
A collaborator's localhost is their own machine, not yours.

## 5. Verify and build

From the repository root:
```sh
node scripts/check-runtime.cjs
node scripts/check-repository.cjs
node --check Backend/server.js
node --test Backend/passwords.test.js
npm --prefix frontend test -- --watchAll=false
npm --prefix frontend run build
```
The repository check inspects tracked files and needs Git initialized. It is not a complete secret scanner.
The React output is frontend/build. Node source does not require compilation.
The tests do not require MySQL; they cover password verification and a basic frontend render.
Database integration, uploads and chatbot workflows still need manual/integration testing.

## 6. First GitHub push

Create an EMPTY GitHub repository (do not initialize another README).
From this folder, Git is already initialized. On a new folder use `git init` once.
```sh
git config user.name "Your Name"
git config user.email "YOUR_GITHUB_EMAIL"
git branch -M main
git add .
git diff --cached --stat
node scripts/check-repository.cjs
git diff --cached
git commit -m "Prepare Plan Code Build workflow and project setup"
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```
Inspect the staged diff before committing. If origin exists, inspect `git remote -v` and use
`git remote set-url origin URL` only if needed.
Authenticate via Git Credential Manager, SSH, or a suitable token; never put tokens in the remote URL.
.env, dependencies, uploads and builds are ignored. Do not commit database dumps or real account data.

## 7. Add your three collaborators

1. Open the repository's Settings → Collaborators / Manage access.
2. Invite the three actual GitHub usernames and have each accept.
3. For an organization repository, give contributors Write access and keep administration with the owner.
4. Each person clones the repository and performs their own local setup above.
5. Assign the roles in docs/PLAN.md and create the GitHub Project board.
6. Configure main branch protection/rulesets where available: pull requests, one peer approval,
   resolved conversations, and no force pushes. Require a Jenkins status only after your Jenkins
   integration actually publishes that status. Availability depends on repository/account settings.

Daily contributor workflow:
```sh
git switch main
git pull --ff-only
git switch -c feature/12-event-filter
# edit and run checks
git add .
git commit -m "Add event filtering"
git push -u origin feature/12-event-filter
```
Open a PR to main and link the issue. Another member reviews; merge after the build passes.
Update your main branch after merge. Keep unrelated changes in different PRs.
If a merge conflict occurs, resolve it locally, rerun checks and update the same PR.

## 8. Jenkins setup

Use a dedicated workspace/agent, not the folder serving your local app.

1. Install Jenkins following its official installation guide and Java support policy.
2. Install Pipeline and Git plugins; GitHub/GitHub Branch Source are optional for webhook/multibranch integration.
3. Provision Git, compatible Node and npm on the build agent. Restart the Jenkins service if PATH changes.
4. Create a Pipeline job named student-helpdesk. Choose Pipeline script from SCM → Git.
5. Enter the repository URL, branch */main, and script path Jenkinsfile.
6. For a private repository, add read-access Git credentials in Jenkins Credentials and select their ID.
   Do not paste credentials into Jenkinsfile. This pipeline does not need application DB credentials.
7. Save and select Build Now. The agent must reach the npm registry.
8. Inspect the Plan, Code and Build stages and download frontend/build from archived artifacts.

Plan checks out source and checks the documented plan/runtime. Code checks tracked-file exclusions.
Build uses npm ci, backend syntax/password tests, frontend tests and an optimized frontend build.
It archives the frontend only on success. No local .env or MySQL access is needed.
Python is required to run the application, but this pipeline does not run chatbot integration tests.

Start with manual builds. For automatic builds, configure GitHub webhook integration for a reachable
Jenkins HTTPS endpoint and the appropriate job trigger; GitHub cannot reach your localhost.
Alternatively configure SCM polling (for example H/5 * * * *) in the job.
For PR builds use a Multibranch Pipeline with GitHub Branch Source, selecting your repository and
branch/PR discovery. Keep untrusted PR builds away from credentials and privileged agents.
Jenkinsfile by itself does not configure a webhook or publish required GitHub checks.

If a build fails:
- Runtime check: install compatible Node on the agent/service account.
- npm ci: resolve lockfile mismatch locally, commit the lockfile; check registry access.
- Tests/build: inspect the first failing command and fix in a branch.
- Checkout: verify URL, permissions and Jenkins credentials.
- No artifacts: artifacts are only archived after successful build.
- Do not use npm audit fix --force without reviewing breaking changes.

## 9. Assignment evidence and remaining scope

Use docs/PLAN.md for issue/board, PR/review and build-artifact evidence.
The pipeline has not been executed on your Jenkins server until you configure and run the job.
No collaborators are invited automatically and no remote push has been performed by preparation alone.

Known limitations: legacy Create React App dependencies; basic automated test coverage;
keyword-based chatbot; uploads trust provided MIME types; database/file changes lack full transactions.
These remain follow-up issues. The project is a collaboration/build baseline, not a production security certification.

## References
- [Jenkins Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins installation](https://www.jenkins.io/doc/book/installing/)
- [Jenkins Java support policy](https://www.jenkins.io/doc/book/platform-information/support-policy-java/)
- [Node built-in Argon2 introduction](https://nodejs.org/en/blog/release/v24.7.0)

