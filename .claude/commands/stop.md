---
allowed-tools: Bash(*), KillShell
description: Stop the Resume Agent frontend and backend servers
---

# Stop Resume Agent Servers

Stop both the Resume Agent backend and frontend servers that are running in the background.

## Steps

1. Use KillShell to stop any background tasks running the frontend (npm run dev on port 5173) or backend (uvicorn on port 8001)

2. Confirm to the user that the servers have been stopped
