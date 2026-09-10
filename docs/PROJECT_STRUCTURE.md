# Project structure

```text
StudentHelpdesk/
├── Backend/
│   ├── uploads/              # Runtime uploads; contents are ignored by Git
│   ├── .env.example          # Safe backend configuration template
│   ├── ai.py                 # Helpdesk response engine
│   ├── auth.js               # Argon2 verification and MySQL sessions
│   ├── db.js                 # MySQL connection pool
│   ├── migrate-passwords.js  # One-time legacy password migration
│   ├── server.js             # Express API
│   ├── package.json
│   └── requirements.txt
├── frontend/
│   ├── public/               # Static browser assets
│   ├── src/
│   │   ├── pages/            # Page-level React components
│   │   ├── App.js            # Current application and routes
│   │   ├── App.css
│   │   └── index.js
│   ├── .env.example          # Safe frontend configuration template
│   └── package.json
├── docs/
│   └── PROJECT_STRUCTURE.md
├── .gitignore
└── README.md
```

## Repository rules

- Never commit `Backend/.env`; only `.env.example` belongs in Git.
- Never commit dependencies, production builds, uploaded documents, or logs.
- Run backend commands from `Backend` and frontend commands from `frontend`.
- Uploaded files belong in external/object storage for production deployments.

