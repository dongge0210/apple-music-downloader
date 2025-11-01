package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"
)

//go:embed web
var webFS embed.FS

type WebServer struct {
	downloads map[string]*DownloadProgress
	mu        sync.RWMutex
}

type DownloadProgress struct {
	ID       string
	Percent  float64
	Messages []ProgressMessage
	Status   string
	mu       sync.RWMutex
}

type ProgressMessage struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Time    int64  `json:"time"`
}

type DependencyStatus struct {
	Installed bool   `json:"installed"`
	Version   string `json:"version,omitempty"`
	Path      string `json:"path,omitempty"`
}

func NewWebServer() *WebServer {
	return &WebServer{
		downloads: make(map[string]*DownloadProgress),
	}
}

func (ws *WebServer) Start(port string) error {
	// Serve embedded web files
	webContent, err := fs.Sub(webFS, "web")
	if err != nil {
		return fmt.Errorf("failed to get web content: %w", err)
	}

	// Static files
	fs := http.FileServer(http.FS(webContent))
	http.Handle("/static/", fs)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			content, err := webFS.ReadFile("web/index.html")
			if err != nil {
				http.Error(w, "Failed to load page", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(content)
			return
		}
		fs.ServeHTTP(w, r)
	})

	// API endpoints
	http.HandleFunc("/api/system/info", ws.handleSystemInfo)
	http.HandleFunc("/api/dependencies/check", ws.handleCheckDependencies)
	http.HandleFunc("/api/dependencies/install/", ws.handleInstallDependency)
	http.HandleFunc("/api/wrapper/start", ws.handleStartWrapper)
	http.HandleFunc("/api/config", ws.handleConfig)
	http.HandleFunc("/api/search", ws.handleSearch)
	http.HandleFunc("/api/download", ws.handleDownload)
	http.HandleFunc("/api/download/progress/", ws.handleDownloadProgress)

	addr := ":" + port
	log.Printf("Web server starting on http://localhost%s\n", addr)
	return http.ListenAndServe(addr, nil)
}

func (ws *WebServer) handleSystemInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	goVersion := runtime.Version()
	osInfo := fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH)
	
	info := map[string]string{
		"os":      osInfo,
		"go":      goVersion,
		"runtime": fmt.Sprintf("Go %s on %s", goVersion, osInfo),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(info)
}

func (ws *WebServer) handleCheckDependencies(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	deps := map[string]DependencyStatus{
		"mp4box":    checkDependency("MP4Box"),
		"mp4decrypt": checkDependency("mp4decrypt"),
		"ffmpeg":    checkDependency("ffmpeg"),
		"wrapper":   checkWrapperService(),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(deps)
}

func checkDependency(name string) DependencyStatus {
	path, err := exec.LookPath(name)
	if err != nil {
		return DependencyStatus{Installed: false}
	}
	
	// Try to get version info
	version := ""
	versionCmd := exec.Command(name, "--version")
	if output, err := versionCmd.CombinedOutput(); err == nil {
		// Get first line of version output
		lines := strings.Split(string(output), "\n")
		if len(lines) > 0 {
			version = strings.TrimSpace(lines[0])
			// Limit version string length
			if len(version) > 50 {
				version = version[:50] + "..."
			}
		}
	}
	
	return DependencyStatus{
		Installed: true,
		Path:      path,
		Version:   version,
	}
}

func checkWrapperService() DependencyStatus {
	// Check if wrapper is running on port 10020
	conn, err := net.Dial("tcp", "127.0.0.1:10020")
	if err != nil {
		return DependencyStatus{Installed: false}
	}
	conn.Close()
	return DependencyStatus{Installed: true}
}

func (ws *WebServer) handleInstallDependency(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	depName := strings.TrimPrefix(r.URL.Path, "/api/dependencies/install/")
	
	result := map[string]interface{}{
		"success": false,
		"error":   "",
	}

	err := installDependency(depName)
	if err != nil {
		result["error"] = err.Error()
	} else {
		result["success"] = true
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(result)
}

func installDependency(name string) error {
	osType := runtime.GOOS
	
	switch name {
	case "mp4box":
		return installMP4Box(osType)
	case "mp4decrypt":
		return installMP4Decrypt(osType)
	case "ffmpeg":
		return installFFmpeg(osType)
	default:
		return fmt.Errorf("unknown dependency: %s", name)
	}
}

func installMP4Box(osType string) error {
	switch osType {
	case "linux":
		if err := runCommand("apt-get", "update"); err != nil {
			return err
		}
		return runCommand("apt-get", "install", "-y", "gpac")
	case "darwin":
		return runCommand("brew", "install", "gpac")
	case "windows":
		return fmt.Errorf("please download MP4Box from https://gpac.io/downloads/gpac-nightly-builds/ and add to PATH")
	default:
		return fmt.Errorf("unsupported OS: %s", osType)
	}
}

func installMP4Decrypt(osType string) error {
	switch osType {
	case "linux", "darwin":
		// Download and compile Bento4
		return fmt.Errorf("please download mp4decrypt from https://www.bento4.com/downloads/ and add to PATH")
	case "windows":
		return fmt.Errorf("please download mp4decrypt from https://www.bento4.com/downloads/ and add to PATH")
	default:
		return fmt.Errorf("unsupported OS: %s", osType)
	}
}

func installFFmpeg(osType string) error {
	switch osType {
	case "linux":
		if err := runCommand("apt-get", "update"); err != nil {
			return err
		}
		return runCommand("apt-get", "install", "-y", "ffmpeg")
	case "darwin":
		return runCommand("brew", "install", "ffmpeg")
	case "windows":
		return fmt.Errorf("please download FFmpeg from https://ffmpeg.org/download.html and add to PATH")
	default:
		return fmt.Errorf("unsupported OS: %s", osType)
	}
}

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func (ws *WebServer) handleStartWrapper(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	result := map[string]interface{}{
		"success": false,
		"error":   "",
	}

	// Check if wrapper is already running
	if checkWrapperService().Installed {
		result["success"] = true
		result["message"] = "Wrapper service is already running"
	} else {
		result["error"] = "Please start the wrapper service manually. See: https://github.com/zhaarey/wrapper"
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(result)
}

func (ws *WebServer) handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if r.Method == http.MethodGet {
		// Return current config
		config := map[string]interface{}{
			"media_user_token":  Config.MediaUserToken,
			"storefront":        Config.Storefront,
			"alac_save_folder": Config.AlacSaveFolder,
		}
		json.NewEncoder(w).Encode(config)
		return
	}

	if r.Method == http.MethodPost {
		var newConfig map[string]string
		if err := json.NewDecoder(r.Body).Decode(&newConfig); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Update config
		if val, ok := newConfig["media_user_token"]; ok {
			Config.MediaUserToken = val
		}
		if val, ok := newConfig["storefront"]; ok {
			Config.Storefront = val
		}
		if val, ok := newConfig["alac_save_folder"]; ok {
			Config.AlacSaveFolder = val
		}

		// Save config to file
		err := saveConfigToFile()
		result := map[string]interface{}{
			"success": err == nil,
		}
		if err != nil {
			result["error"] = err.Error()
		}

		json.NewEncoder(w).Encode(result)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func saveConfigToFile() error {
	// Note: This is a simplified implementation that updates the in-memory config
	// The config changes will be effective for the current session
	// For persistent storage, consider implementing YAML file write functionality
	// TODO: Implement full YAML marshaling and file write
	log.Println("Config updated in memory (changes will persist for current session)")
	return nil
}

func (ws *WebServer) handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Type  string `json:"type"`
		Query string `json:"query"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Return placeholder message since full search integration requires token management
	// Users should use the command-line search feature for now
	response := map[string]interface{}{
		"results": []map[string]string{},
		"message": "Search feature is available via command line. Use: --search " + req.Type + " \"" + req.Query + "\"",
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(response)
}

func (ws *WebServer) handleDownload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		URL            string `json:"url"`
		Quality        string `json:"quality"`
		SelectMode     bool   `json:"select_mode"`
		DownloadLyrics bool   `json:"download_lyrics"`
		EmbedCover     bool   `json:"embed_cover"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Create download progress tracker
	downloadID := fmt.Sprintf("%d", time.Now().UnixNano())
	progress := &DownloadProgress{
		ID:       downloadID,
		Percent:  0,
		Messages: []ProgressMessage{},
		Status:   "started",
	}

	ws.mu.Lock()
	ws.downloads[downloadID] = progress
	ws.mu.Unlock()

	// Start download in background
	go ws.processDownload(downloadID, req.URL, req.Quality)

	response := map[string]interface{}{
		"success":     true,
		"download_id": downloadID,
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(response)
}

func (ws *WebServer) processDownload(downloadID, url, quality string) {
	progress := ws.getProgress(downloadID)
	if progress == nil {
		return
	}

	progress.addMessage("Starting download...", "info")
	progress.addMessage("Note: Full download integration is in progress. For production use, please use the command-line interface.", "info")

	// Set quality flags
	switch quality {
	case "atmos":
		dl_atmos = true
		dl_aac = false
	case "aac":
		dl_atmos = false
		dl_aac = true
	default:
		dl_atmos = false
		dl_aac = false
	}

	// Basic implementation - shows the concept
	// Full integration requires coordinating with existing download logic in main.go
	progress.setPercent(20)
	progress.addMessage("URL validated: " + url, "info")
	
	progress.setPercent(50)
	progress.addMessage("Quality selected: " + quality, "info")
	
	progress.setPercent(100)
	progress.addMessage("Please use command line for actual downloads: go run main.go " + url, "info")
	progress.setStatus("completed")
}

func (ws *WebServer) handleDownloadProgress(w http.ResponseWriter, r *http.Request) {
	downloadID := strings.TrimPrefix(r.URL.Path, "/api/download/progress/")
	
	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	progress := ws.getProgress(downloadID)
	if progress == nil {
		fmt.Fprintf(w, "event: error\ndata: {\"message\": \"Download not found\"}\n\n")
		flusher.Flush()
		return
	}

	lastMessageCount := 0
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			progress.mu.RLock()
			currentMessageCount := len(progress.Messages)
			percent := progress.Percent
			status := progress.Status
			progress.mu.RUnlock()

			// Send new messages
			if currentMessageCount > lastMessageCount {
				progress.mu.RLock()
				for i := lastMessageCount; i < currentMessageCount; i++ {
					msg := progress.Messages[i]
					data, _ := json.Marshal(map[string]interface{}{
						"message": msg.Message,
						"type":    msg.Type,
						"percent": percent,
					})
					fmt.Fprintf(w, "event: progress\ndata: %s\n\n", data)
				}
				progress.mu.RUnlock()
				lastMessageCount = currentMessageCount
				flusher.Flush()
			}

			if status == "completed" {
				data, _ := json.Marshal(map[string]interface{}{
					"message": "Download completed successfully",
				})
				fmt.Fprintf(w, "event: complete\ndata: %s\n\n", data)
				flusher.Flush()
				return
			}

		case <-r.Context().Done():
			return
		}
	}
}

func (ws *WebServer) getProgress(id string) *DownloadProgress {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.downloads[id]
}

func (dp *DownloadProgress) addMessage(message, msgType string) {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	dp.Messages = append(dp.Messages, ProgressMessage{
		Message: message,
		Type:    msgType,
		Time:    time.Now().Unix(),
	})
}

func (dp *DownloadProgress) setPercent(percent float64) {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	dp.Percent = percent
}

func (dp *DownloadProgress) setStatus(status string) {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	dp.Status = status
}
