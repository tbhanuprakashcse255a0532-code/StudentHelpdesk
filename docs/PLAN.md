# Plan → Code → Build

## Goal
Deliver the Student Helpdesk prototype through the first three DevOps stages.
Deployment, release, monitoring, and production operations are future work.

## Team of four
| Person | Primary responsibility | Suggested reviewer |
| --- | --- | --- |
| You / repository owner | Planning, integration, Jenkins | Member 3 |
| Member 1 | React UI and accessibility | Member 2 |
| Member 2 | Express, MySQL, authentication | Member 1 |
| Member 3 | Build checks, documentation, Jenkins | You |

These are assignments to agree with your teammates, not actual GitHub invitations.

## Plan
Create a GitHub Project with Backlog, Ready, In Progress, In Review, Done.
Create issues using the task template, assign an owner and reviewer, and write acceptance criteria.
Initial backlog: reproducible setup, authentication regression tests, UI error handling,
PDF extraction, safe uploads, dependency modernization.
Evidence: issue URL, project board, owner and criteria.

## Code
One branch per issue: feature/12-event-filter, fix/13-login, docs/14-setup.
Open a pull request into main. Link its issue, describe changes, include verification.
A different person reviews before the owner merges.
Evidence: commits, PR discussion and approval.

## Build
Jenkins checks out the commit, checks prerequisites and tracked-file exclusions,
installs lockfile dependencies, validates backend syntax, runs password and frontend tests,
and builds/archives the React bundle.
The Jenkins stages have exactly the requested names: Plan, Code, Build.
Plan/Code checks in Jenkins do not replace human planning or review.
Evidence: Jenkins build URL, console output and archived artifact.

## Definition of done
Acceptance criteria met, peer review completed, build successful, setup docs current.
No deployment is performed by this pipeline.

