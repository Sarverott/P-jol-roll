@echo off
rem # NOTE: docker install, node install, npm upgrade with n, install python, pip and uv, 

rem Tools of P_JOL_ROLL on Windows with winget: takes only what is missing.
rem n does not run on Windows - winget keeps node at the newest LTS instead.
rem Read before running - it installs programs:   scripts\install.bat

where docker >nul 2>nul || winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements
where node >nul 2>nul || winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
where node >nul 2>nul && call npm install -g npm@latest
where python >nul 2>nul || winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements
where python >nul 2>nul && python -m pip install --upgrade pip
where uv >nul 2>nul || winget install --id astral-sh.uv -e --accept-source-agreements --accept-package-agreements

echo.
echo Open a new terminal, then: npm install ^&^& npx task verify
