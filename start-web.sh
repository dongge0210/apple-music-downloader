#!/bin/bash

# Apple Music Downloader - Web GUI Startup Script
# This script starts the web interface and checks dependencies

echo "🎵 Apple Music Downloader - Web GUI"
echo "===================================="
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go from https://golang.org/dl/"
    exit 1
fi

echo "✅ Go is installed: $(go version)"
echo ""

# Check if the binary exists, if not build it
if [ ! -f "./am-dl" ]; then
    echo "🔨 Building Apple Music Downloader..."
    go build -o am-dl
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
    echo "✅ Build successful!"
    echo ""
fi

# Check for dependencies
echo "📦 Checking dependencies..."
echo ""

check_dependency() {
    if command -v $1 &> /dev/null; then
        echo "  ✅ $1 is installed"
        return 0
    else
        echo "  ❌ $1 is not installed"
        return 1
    fi
}

check_dependency "MP4Box"
check_dependency "mp4decrypt"
check_dependency "ffmpeg"

echo ""
echo "ℹ️  Note: Missing dependencies can be installed from the web interface"
echo ""

# Start the web server
PORT=${1:-8080}
echo "🚀 Starting web server on port $PORT..."
echo "🌐 Open your browser and go to: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

./am-dl --web --port $PORT
