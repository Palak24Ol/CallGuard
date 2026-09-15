@echo off
cd /d "%~dp0"
echo CallGuard will be available at http://127.0.0.1:4173
echo Open that address in your browser. Close this window to stop the app.
node server.mjs
pause
