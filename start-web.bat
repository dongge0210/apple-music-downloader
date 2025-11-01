@echo off
REM Apple Music Downloader - Web GUI Startup Script for Windows
REM This script starts the web interface and checks dependencies

echo.
echo 🎵 Apple Music Downloader - Web GUI
echo ====================================
echo.

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Go is not installed. Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('go version') do set GO_VERSION=%%i
echo ✅ Go is installed: %GO_VERSION%
echo.

REM Check if the binary exists, if not build it
if not exist "am-dl.exe" (
    echo 🔨 Building Apple Music Downloader...
    go build -o am-dl.exe
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
    echo ✅ Build successful!
    echo.
)

REM Check for dependencies
echo 📦 Checking dependencies...
echo.

where MP4Box >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✅ MP4Box is installed
) else (
    echo   ❌ MP4Box is not installed
)

where mp4decrypt >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✅ mp4decrypt is installed
) else (
    echo   ❌ mp4decrypt is not installed
)

where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✅ ffmpeg is installed
) else (
    echo   ❌ ffmpeg is not installed
)

echo.
echo ℹ️  Note: Missing dependencies can be installed from the web interface
echo.

REM Start the web server
set PORT=%1
if "%PORT%"=="" set PORT=8080

echo 🚀 Starting web server on port %PORT%...
echo 🌐 Open your browser and go to: http://localhost:%PORT%
echo.
echo Press Ctrl+C to stop the server
echo.

am-dl.exe --web --port %PORT%
pause
