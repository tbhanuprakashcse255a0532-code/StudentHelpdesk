# Student Helpdesk — Plan → Code → Build → Test → Deploy

A college helpdesk web application built with React, Node.js/Express, MySQL, and a Python-based AI assistant.

The application provides separate Admin and Student modules, including authentication, dashboard navigation, Events, Notices, Q&A, and chatbot functionality.

The project supports a four-member collaboration workflow, Jenkins automation for Plan, Code, and Build, Selenium browser testing, and Docker-based deployment with MySQL persistence and IIS reverse proxy integration.

## Features

- Separate Admin and Student login.
- Secure session-based authentication using HTTP-only cookies.
- Admin and Student dashboards.
- Events management.
- Notices management.
- Question and Answer (Q&A) module.
- Python-based helpdesk chatbot.
- MySQL database integration.
- Docker-based application deployment.
- IIS reverse proxy using URL Rewrite and ARR.
- Selenium browser automation testing.
- Jenkins Plan → Code → Build pipeline.

## Requirements

### Application development
- Git and GitHub.
- Node.js 24.x or a newer compatible version.
- npm.
- MySQL 8.
- Python 3 with pip.

### Selenium testing
- Python 3.
- Selenium Python package.
- Google Chrome browser.
- Selenium Manager for browser driver management.

### Docker deployment
- Windows 11 or compatible OS.
- Docker Desktop with Docker Compose.
- IIS with URL Rewrite and Application Request Routing (ARR 3.0).

### Jenkins
- Jenkins controller with a supported Java runtime.
- Pipeline and Git plugins.
- Git, Node.js and npm on the build agent.

## Repository layout

```text
StudentHelpdesk/
│
├── .github/                  Issue and PR templates
├── Backend/                  Express API and authentication
│   └── uploads/              Uploaded files
│
├── frontend/                 React frontend
├── database/
│   └── schema.sql            Empty database schema
│
├── docker/
│   └── mysql/
│       └── init/
│           └── 01-s_helpdesk_backup.sql
│
├── selenium_tests/
│   └── test_application.py   Selenium browser smoke test
│
├── scripts/                  Runtime and repository checks
├── docs/
│   └── PLAN.md               Project plan and team workflow
│
├── docker-compose.yml        Docker services configuration
├── Jenkinsfile               Jenkins pipeline
└── README.md
```

## 1. Clone and install

```bash
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY

node scripts/check-runtime.cjs

npm ci --prefix Backend
npm ci --prefix frontend
```

### Windows PowerShell

```powershell
Copy-Item Backend/.env.example Backend/.env
Copy-Item frontend/.env.example frontend/.env

py -m pip install -r Backend/requirements.txt
```

### Linux/macOS

```bash
cp Backend/.env.example Backend/.env
cp frontend/.env.example frontend/.env

python3 -m venv .venv
. .venv/bin/activate

python3 -m pip install -r Backend/requirements.txt
```

## 2. Create a fresh local database

Each teammate should use their own local database.

```sql
CREATE DATABASE s_helpdesk
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'helpdesk_app'@'localhost'
IDENTIFIED BY 'CHOOSE_A_PRIVATE_DATABASE_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE
ON s_helpdesk.*
TO 'helpdesk_app'@'localhost';

USE s_helpdesk;

SOURCE D:/path/to/REPOSITORY/database/schema.sql;
```

Do not import `schema.sql` into an existing working database. It is intended for empty databases, not upgrades.

Edit `Backend/.env`:

```env
DB_HOST=localhost
DB_USER=helpdesk_app
DB_PASSWORD=YOUR_PRIVATE_DATABASE_PASSWORD
DB_NAME=s_helpdesk
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Edit `frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

Never put passwords or secrets in frontend environment variables.

## 3. Create application accounts

GitHub collaborator accounts and application login accounts are separate.

### Admin account — PowerShell

From the `Backend` directory:

```powershell
$env:ACCOUNT_ROLE = 'admin'
$env:ACCOUNT_EMAIL = 'your-admin@example.com'

$secret = Read-Host 'Choose a password of at least 12 characters' -AsSecureString
$env:ACCOUNT_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password

node create-account.js

Remove-Item Env:ACCOUNT_PASSWORD
```

### Student account — PowerShell

```powershell
$env:ACCOUNT_ROLE = 'student'
$env:ACCOUNT_EMAIL = 'your-student@example.com'
$env:ACCOUNT_NAME = 'Student Name'
$env:ACCOUNT_BRANCH = 'CSE'
$env:ACCOUNT_PIN = 'YOUR_UNIQUE_PIN'
```

Set the password using the hidden prompt, execute `node create-account.js`, and clear the password environment variable.

Keep passwords and PINs private.

## 4. Run locally

**Terminal 1 — Backend**

```bash
cd Backend
npm start
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm start
```

Open:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5000
```

Student login requires email, password, branch, and PIN matching its database record. Admin login requires email and password.

Sessions use HTTP-only cookies.

## 5. Selenium browser testing

Selenium is used to automate browser testing and verify that the Student Helpdesk application loads correctly.

### Install Selenium

On Windows PowerShell:

```powershell
py -m pip install selenium
```

Verify installation:

```powershell
py -m pip show selenium
```

Check Python:

```powershell
py --version
```

Check Google Chrome:

```powershell
& "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" --version
```

Selenium 4 includes Selenium Manager, which can manage compatible browser drivers automatically.

### Selenium test file

The project contains:

```text
selenium_tests/test_application.py
```

### Run the Selenium test

First, make sure the application is running and accessible.

Then execute from the project root:

```powershell
py .\selenium_tests\test_application.py
```

### Testing workflow

1. Launch the Chrome browser through Selenium.
2. Open the Student Helpdesk application.
3. Verify that the application page loads.
4. Check the browser page title and document loading state.
5. Observe browser output and any test errors.

### Selenium test coverage

| Test | Purpose |
|---|---|
| Browser launch | Verify Chrome starts |
| Application navigation | Open the Student Helpdesk URL |
| Page loading | Verify the page loads successfully |
| Page title | Check the browser title |
| Document state | Check that page loading completes |

### Actual Selenium testing

A basic Selenium browser smoke test was executed successfully.

- Chrome launched successfully.
- The application URL opened.
- The browser reported the page title as `React App`.
- The document loading state completed.

Manual functional testing was additionally performed for Admin and Student login, dashboard navigation, Events, Notices, Q&A, and chatbot responses.

**Note:** The current Selenium script is a basic browser smoke test, not a complete automated end-to-end test suite. Manual functional testing should not be described as Selenium automation.

## 6. Docker deployment

The application supports Docker-based deployment using Docker Compose.

### Docker services

| Service | Technology | Purpose |
|---|---|---|
| frontend | React + Nginx | Serves frontend |
| backend | Node.js + Express | API services |
| db | MySQL 8.0 | Persistent database |

Create `.env.docker` in the project root:

```env
MYSQL_ROOT_PASSWORD=YOUR_PRIVATE_ROOT_PASSWORD
DB_NAME=s_helpdesk
DB_USER=helpdesk_app
DB_PASSWORD=YOUR_PRIVATE_DATABASE_PASSWORD
```

Never commit `.env.docker` or its backup.

### Build and start

```powershell
docker compose --env-file .env.docker up -d --build
```

Check containers:

```powershell
docker compose --env-file .env.docker ps
```

Check backend logs:

```powershell
docker compose --env-file .env.docker logs --tail=40 backend
```

Check database logs:

```powershell
docker compose --env-file .env.docker logs --tail=40 db
```

### Database persistence

MySQL data is stored in the Docker named volume:

```text
mysql_data
```

The initialization SQL file is:

```text
docker/mysql/init/01-s_helpdesk_backup.sql
```

Important:
- MySQL initialization scripts execute when the database volume is initialized for the first time.
- Changing `.env.docker` does not automatically change passwords in an existing MySQL database.
- Never remove the `mysql_data` volume during routine troubleshooting.
- Back up the database before migrations or recovery operations.

### Docker frontend address

```text
http://127.0.0.1:18080
```

## 7. IIS reverse proxy deployment

The Windows deployment uses IIS to forward application requests to the Docker frontend.

### Prerequisites

- IIS.
- IIS URL Rewrite.
- Application Request Routing (ARR 3.0).
- Docker Desktop.

Enable ARR proxy functionality in IIS.

### Local hostname

```text
studenthelpdesk.test
```

Ensure the hostname resolves to the local machine.

### URL Rewrite configuration

| Request path | Destination |
|---|---|
| `/StudentHelpdesk/` | `http://127.0.0.1:18080/StudentHelpdesk/` |
| `/api/` | `http://127.0.0.1:18080/api/` |
| `/uploads/` | `http://127.0.0.1:18080/uploads/` |

### Application URL

```text
http://studenthelpdesk.test/StudentHelpdesk/
```

### API verification

```powershell
curl.exe -i http://studenthelpdesk.test/api/auth/me
```

An unauthenticated request may return `401 Unauthorized`, which is expected when no valid session exists.

## 8. Application and deployment testing results

The following tests were performed on the local deployment.

| Test | Result |
|---|---|
| Docker containers | Passed |
| MySQL health check | Passed |
| Backend startup | Passed |
| Backend-to-MySQL connection | Passed |
| IIS reverse proxy | Passed |
| Frontend loading | Passed |
| Admin login | Passed |
| Admin dashboard and navigation | Passed |
| Student login | Passed |
| Student dashboard and navigation | Passed |
| Events | Passed |
| Notices | Passed |
| Q&A | Passed |
| Chatbot responses | Passed |
| Selenium browser smoke test | Passed |

## 9. Verify and build

From the repository root:

```bash
node scripts/check-runtime.cjs
node scripts/check-repository.cjs
node --check Backend/server.js
node --test Backend/passwords.test.js
npm --prefix frontend test -- --watchAll=false
npm --prefix frontend run build
```

The React production build is generated in:

```text
frontend/build
```

The Jenkins tests and Selenium tests are separate. The current Jenkins pipeline does not automatically execute Selenium browser tests.

## 10. GitHub collaboration workflow

Create an empty GitHub repository.

```bash
git config user.name "Your Name"
git config user.email "YOUR_GITHUB_EMAIL"

git branch -M main
git add .

git diff --cached --stat
node scripts/check-repository.cjs

git diff --cached

git commit -m "Prepare Plan Code Build workflow and deployment"

git remote add origin https://github.com/OWNER/REPOSITORY.git

git push -u origin main
```

Never commit:

- `.env`
- `.env.docker`
- `.env.docker.backup`
- Database dumps containing real data
- Application credentials
- Private uploaded files
- Generated dependencies and build folders

### Add collaborators

Open GitHub Repository → Settings → Collaborators / Manage access.

Invite the other three team members and have them accept.

### Daily workflow

```bash
git switch main
git pull --ff-only

git switch -c feature/12-event-filter

# Make changes and run checks

git add .
git commit -m "Add event filtering"

git push -u origin feature/12-event-filter
```

Create a pull request to `main` and request peer review.

## 11. Jenkins setup

The project includes a Jenkins pipeline for Plan → Code → Build.

### Prerequisites

- Jenkins installed.
- Supported Java runtime.
- Pipeline and Git plugins.
- Git, Node.js and npm installed on the build agent.
- Repository access configured in Jenkins.

### Create a Pipeline job

1. Open Jenkins.
2. Create a Pipeline job named `student-helpdesk`.
3. Select Pipeline script from SCM.
4. Select Git.
5. Enter the repository URL.
6. Select branch `*/main`.
7. Set script path to `Jenkinsfile`.
8. Configure credentials if the repository is private.
9. Save the job.
10. Select Build Now.

### Pipeline stages

| Stage | Purpose |
|---|---|
| Plan | Checks project plan and runtime requirements |
| Code | Checks repository structure and exclusions |
| Build | Installs dependencies, runs tests and builds frontend |

The pipeline archives the frontend build when successful.

The current Jenkins pipeline does not automatically deploy to Docker/IIS or run Selenium browser tests.

### Automatic builds

For automatic builds, configure GitHub webhook integration with a publicly reachable Jenkins HTTPS endpoint.

Alternatively, configure SCM polling.

A local-only Jenkins server is not reachable directly by GitHub webhooks.

## 12. Troubleshooting

### Backend cannot connect to MySQL

Check:

```powershell
docker compose --env-file .env.docker ps
```

Check backend logs:

```powershell
docker compose --env-file .env.docker logs --tail=50 backend
```

Verify:
- MySQL is healthy.
- `DB_HOST` is `db` inside Docker.
- `DB_NAME` and `DB_USER` are correct.
- Backend `DB_PASSWORD` matches the existing MySQL account password.

Changing `.env.docker` alone does not change an existing MySQL account password.

### Frontend does not load

Check Docker containers and confirm that frontend is mapped to:

```text
127.0.0.1:18080
```

Check IIS URL Rewrite and ARR proxy settings.

### Selenium cannot launch Chrome

Verify:
- Google Chrome is installed.
- Selenium is installed using `py -m pip install selenium`.
- The Python interpreter used to run the test has Selenium installed.
- Selenium Manager can access the network to obtain a compatible driver if one is not already available.

### API returns 401

An unauthenticated request may return:

```json
{"success":false}
```

This is expected when no valid session exists.

### Jenkins build fails

- Runtime error: verify Node.js and npm versions.
- `npm ci` error: check lockfiles and registry connectivity.
- Test failure: inspect the first failing test.
- Checkout failure: verify repository URL and credentials.
- Missing artifacts: artifacts are archived only after successful builds.

## 13. Known limitations and future improvements

- Legacy Create React App dependencies.
- Basic automated test coverage.
- Selenium currently performs a basic browser smoke test; full login and module-level automation can be added.
- Keyword-based chatbot rather than a fully trained conversational model.
- Upload validation requires further security improvements.
- Database and file operations do not have full transaction support.
- Jenkins pipeline builds the application but does not automatically deploy it.
- Local IIS deployment is configured for the development machine, not public internet hosting.

The project is a college collaboration, build, testing, and local deployment implementation. It is not a production security certification.

## References

- Selenium documentation: https://www.selenium.dev/documentation/
- Selenium Python documentation: https://www.selenium.dev/selenium/docs/api/py/
- Jenkins Pipeline documentation: https://www.jenkins.io/doc/book/pipeline/
- Jenkins installation documentation: https://www.jenkins.io/doc/book/installing/
- Node.js documentation: https://nodejs.org/docs/
- React documentation: https://react.dev/
- Express documentation: https://expressjs.com/
- MySQL documentation: https://dev.mysql.com/doc/
- Docker Compose documentation: https://docs.docker.com/compose/
- Microsoft IIS URL Rewrite documentation: https://learn.microsoft.com/iis/extensions/url-rewrite-module/
