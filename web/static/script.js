// Global state
let eventSource = null;
let currentDownloadId = null;
let downloadStartTime = null;
let totalTracks = 0;
let completedTracks = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeButtons();
    checkSystemInfo();
    checkDependencies();
    checkAuthStatus();
    loadConfig();
});

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Initialize button listeners
function initializeButtons() {
    document.getElementById('download-btn').addEventListener('click', startDownload);
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('config-btn').addEventListener('click', toggleConfig);
    document.getElementById('save-config-btn').addEventListener('click', saveConfig);
    document.getElementById('refresh-auth').addEventListener('click', checkAuthStatus);
    
    // Install buttons for dependencies
    document.querySelectorAll('.install-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const depName = this.parentElement.dataset.dep;
            installDependency(depName);
        });
    });
    
    // Start buttons for wrapper
    document.querySelectorAll('.start-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const depName = this.parentElement.dataset.dep;
            startWrapper();
        });
    });
}

// Check system info
async function checkSystemInfo() {
    try {
        const response = await fetch('/api/system/info');
        const data = await response.json();
        
        const systemInfoEl = document.getElementById('system-info');
        if (systemInfoEl && data.runtime) {
            systemInfoEl.textContent = data.runtime;
        }
    } catch (error) {
        console.error('Failed to check system info:', error);
    }
}

// Check dependencies status
async function checkDependencies() {
    try {
        const response = await fetch('/api/dependencies/check');
        const data = await response.json();
        
        for (const [dep, status] of Object.entries(data)) {
            updateDependencyStatus(dep, status);
        }
    } catch (error) {
        console.error('Failed to check dependencies:', error);
        addLog('Failed to check dependencies', 'error');
    }
}

// Check authentication status
async function checkAuthStatus() {
    const tokenStatus = document.getElementById('token-status');
    tokenStatus.textContent = '检查中...';
    
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.hasMediaUserToken) {
            tokenStatus.innerHTML = '<span style="color: var(--success-color);">✅ Media User Token 已配置</span>';
        } else {
            tokenStatus.innerHTML = '<span style="color: var(--warning-color);">⚠️ Media User Token 未配置</span>';
        }
        
        if (data.storefront) {
            tokenStatus.innerHTML += `<br><span style="color: var(--text-secondary);">🌐 区域: ${data.storefront}</span>`;
        }
        
        tokenStatus.innerHTML += '<br><span style="color: var(--text-secondary);">🔓 Authorization Token 自动获取</span>';
        
    } catch (error) {
        console.error('Failed to check auth status:', error);
        tokenStatus.innerHTML = '<span style="color: var(--danger-color);">❌ 检查失败</span>';
    }
}

// Add core output log entry
function addCoreLog(message, type = 'info') {
    const coreLog = document.getElementById('core-log');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry core-log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    coreLog.appendChild(logEntry);
    coreLog.scrollTop = coreLog.scrollHeight;
    
    // Keep only last 50 entries
    while (coreLog.children.length > 50) {
        coreLog.removeChild(coreLog.firstChild);
    }
}

// Update dependency status in UI
function updateDependencyStatus(dep, status) {
    const depItem = document.querySelector(`.dependency-item[data-dep="${dep}"]`);
    if (!depItem) return;
    
    const statusSpan = depItem.querySelector('.dep-status');
    const installBtn = depItem.querySelector('.install-btn');
    const startBtn = depItem.querySelector('.start-btn');
    
    statusSpan.className = 'dep-status';
    depItem.classList.remove('installed', 'missing');
    
    if (status.installed) {
        let statusText = '✓ 已安装';
        if (status.version) {
            statusText += '\n' + status.version;
        } else if (status.path) {
            const pathParts = status.path.split('/');
            statusText += '\n(' + pathParts[pathParts.length - 1] + ')';
        }
        statusSpan.textContent = statusText;
        statusSpan.classList.add('installed');
        depItem.classList.add('installed');
        statusSpan.title = status.path || '';
        if (installBtn) installBtn.style.display = 'none';
        if (startBtn) startBtn.style.display = 'none';
    } else {
        statusSpan.textContent = '✗ 未安装';
        statusSpan.classList.add('missing');
        depItem.classList.add('missing');
        if (installBtn) installBtn.style.display = 'inline-block';
        if (startBtn) startBtn.style.display = 'inline-block';
    }
}

// Install dependency
async function installDependency(depName) {
    const depItem = document.querySelector(`.dependency-item[data-dep="${depName}"]`);
    const statusSpan = depItem.querySelector('.dep-status');
    const installBtn = depItem.querySelector('.install-btn');
    
    statusSpan.textContent = 'Installing...';
    statusSpan.className = 'dep-status checking';
    installBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/dependencies/install/${depName}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            updateDependencyStatus(depName, {installed: true});
            addLog(`${depName} installed successfully`, 'success');
        } else {
            statusSpan.textContent = '✗ Install Failed';
            statusSpan.classList.add('missing');
            addLog(`Failed to install ${depName}: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error(`Failed to install ${depName}:`, error);
        statusSpan.textContent = '✗ Install Failed';
        statusSpan.classList.add('missing');
        addLog(`Failed to install ${depName}`, 'error');
    } finally {
        installBtn.disabled = false;
    }
}

// Start wrapper service
async function startWrapper() {
    addLog('Starting wrapper service...', 'info');
    try {
        const response = await fetch('/api/wrapper/start', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            updateDependencyStatus('wrapper', {installed: true});
            addLog('Wrapper service started successfully', 'success');
        } else {
            addLog(`Failed to start wrapper: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Failed to start wrapper:', error);
        addLog('Failed to start wrapper service', 'error');
    }
}

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (config.media_user_token) {
            document.getElementById('media-user-token').value = config.media_user_token;
        }
        if (config.storefront) {
            document.getElementById('storefront').value = config.storefront;
        }
        if (config.alac_save_folder) {
            document.getElementById('save-folder').value = config.alac_save_folder;
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Save configuration
async function saveConfig() {
    const config = {
        media_user_token: document.getElementById('media-user-token').value,
        storefront: document.getElementById('storefront').value,
        alac_save_folder: document.getElementById('save-folder').value
    };
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        if (data.success) {
            addLog('Configuration saved successfully', 'success');
        } else {
            addLog('Failed to save configuration', 'error');
        }
    } catch (error) {
        console.error('Failed to save config:', error);
        addLog('Failed to save configuration', 'error');
    }
}

// Toggle config panel
function toggleConfig() {
    const panel = document.getElementById('config-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Perform search
async function performSearch() {
    const searchType = document.getElementById('search-type').value;
    const searchQuery = document.getElementById('search-query').value;
    
    if (!searchQuery.trim()) {
        addLog('Please enter a search query', 'error');
        return;
    }
    
    addLog(`Searching for ${searchType}: ${searchQuery}`, 'info');
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: searchType,
                query: searchQuery
            })
        });
        
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (error) {
        console.error('Search failed:', error);
        addLog('Search failed', 'error');
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('results-list');
    const searchResults = document.getElementById('search-results');
    
    resultsContainer.innerHTML = '';
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
        searchResults.style.display = 'block';
        return;
    }
    
    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <h4>${result.name}</h4>
            <p>${result.artist || result.details || ''}</p>
        `;
        resultItem.addEventListener('click', () => {
            document.getElementById('music-url').value = result.url;
            searchResults.style.display = 'none';
            document.querySelector('.tab-btn[data-tab="url"]').click();
        });
        resultsContainer.appendChild(resultItem);
    });
    
    searchResults.style.display = 'block';
}

// Start download
async function startDownload() {
    const url = document.getElementById('music-url').value;
    const quality = document.getElementById('quality').value;
    const selectMode = document.getElementById('select-mode').checked;
    const downloadLyrics = document.getElementById('download-lyrics').checked;
    const embedCover = document.getElementById('embed-cover').checked;
    
    if (!url.trim()) {
        addLog('请输入Apple Music URL', 'error');
        return;
    }
    
    // Reset counters and show progress section
    downloadStartTime = Date.now();
    totalTracks = 0;
    completedTracks = 0;
    
    document.getElementById('progress-section').style.display = 'block';
    document.getElementById('status-log').innerHTML = '';
    document.getElementById('track-progress').style.display = 'none';
    
    updateProgress(0);
    updateTimer();
    
    addLog('🚀 开始下载...', 'info');
    updateCurrentTask('初始化下载任务...');
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                quality: quality,
                select_mode: selectMode,
                download_lyrics: downloadLyrics,
                embed_cover: embedCover
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentDownloadId = data.download_id;
            listenToProgress(currentDownloadId);
        } else {
            addLog(`❌ 下载启动失败: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Download failed:', error);
        addLog('❌ 下载启动失败', 'error');
    }
}

// Listen to download progress
function listenToProgress(downloadId) {
    if (eventSource) {
        eventSource.close();
    }
    
    eventSource = new EventSource(`/api/download/progress/${downloadId}`);
    
    eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        updateProgress(data.percent);
        
        // Parse message for additional info
        if (data.message) {
            // Check if it's a core output message
            if (data.type && data.type.startsWith('core-')) {
                const coreType = data.type.replace('core-', '');
                addCoreLog(data.message, coreType);
            } else {
                // Check if it's a track download message
                const trackMatch = data.message.match(/📊 Progress: ([\d.]+)% \((\d+)\/(\d+)\) - Downloading: (.+)/);
                if (trackMatch) {
                    const [, percent, current, total, trackName] = trackMatch;
                    updateTrackInfo(trackName, percent);
                    updateCurrentTask(`下载曲目: ${trackName}`);
                    
                    if (!totalTracks) totalTracks = parseInt(total);
                    completedTracks = parseInt(current);
                } else {
                    addLog(data.message, data.type || 'info');
                }
            }
        }
    });
    
    eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        updateProgress(100);
        updateCurrentTask('下载完成！');
        addLog(`✅ ${data.message}`, 'success');
        addCoreLog('✅ 下载流程完成', 'success');
        document.getElementById('track-progress').style.display = 'none';
        eventSource.close();
    });
    
    eventSource.addEventListener('error', (e) => {
        if (e.data) {
            const data = JSON.parse(e.data);
            addLog(`❌ ${data.message}`, 'error');
            addCoreLog(`❌ 错误: ${data.message}`, 'error');
        }
        updateCurrentTask('下载出错');
        eventSource.close();
    });
}

// Update progress bar
function updateProgress(percent) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
}

// Update current task display
function updateCurrentTask(task) {
    document.getElementById('current-task').textContent = task;
}

// Update track info
function updateTrackInfo(trackName, progress) {
    document.getElementById('track-progress').style.display = 'block';
    document.getElementById('track-name').textContent = trackName;
    document.getElementById('track-progress-fill').style.width = `${progress}%`;
    
    // Calculate estimated size and quality based on progress
    const estimatedSize = Math.round(parseFloat(progress) * 10); // Mock calculation
    document.getElementById('track-size').textContent = `~${estimatedSize}MB`;
    document.getElementById('track-quality').textContent = 'ALAC'; // Default quality
}

// Update timer
function updateTimer() {
    if (!downloadStartTime) return;
    
    const elapsed = Date.now() - downloadStartTime;
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('elapsed-time').textContent = 
        `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;
    
    // Calculate remaining time
    if (completedTracks > 0 && totalTracks > completedTracks) {
        const avgTimePerTrack = elapsed / completedTracks;
        const remainingTracks = totalTracks - completedTracks;
        const remainingMs = avgTimePerTrack * remainingTracks;
        const remainingMinutes = Math.floor(remainingMs / 60000);
        const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
        document.getElementById('remaining-time').textContent = 
            `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    
    // Update download speed (mock calculation)
    if (completedTracks > 0) {
        const speed = (completedTracks * 10 / (elapsed / 1000)).toFixed(1); // MB/s
        document.getElementById('download-speed').textContent = `${speed} MB/s`;
    }
    
    // Continue updating
    if (completedTracks < totalTracks) {
        setTimeout(updateTimer, 1000);
    }
}

// Add log entry
function addLog(message, type = 'info') {
    const statusLog = document.getElementById('status-log');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    statusLog.appendChild(logEntry);
    statusLog.scrollTop = statusLog.scrollHeight;
}
