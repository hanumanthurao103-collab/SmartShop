# AI Prompt Log



## 2026-11-08 — Initial project and Git setup



### What I asked the AI

I asked ChatGPT to guide me step by step while setting up my SmartShop MERN project, including the React frontend, Express backend, Git repository, `.gitignore`, first commit, and GitHub push.



### What the AI produced

The AI provided step-by-step PowerShell commands for creating and checking the project structure, configuring Git, creating `.gitignore`, staging files, committing the initial project, and pushing it to GitHub.



### What was wrong or needed checking

The first `git add .` happened before `.gitignore` was created, so `node_modules` files were initially staged. I had to stop, create `.gitignore`, reset the Git staging area, and stage the project again.



### What I did instead

I created `.gitignore` with:



- `node_modules/`

- `.env`

- `dist/`



Then I ran `git reset`, staged the project again, checked `git status`, and confirmed that `node_modules` was not included before creating the initial commit.



### Commit

Initial project setup commit: `023e98f`

