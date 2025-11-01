# Apple Music Downloader - Web GUI

[English](#english) / [简体中文](#简体中文)

---

## English

### 🎉 New Feature: Friendly Web Interface

We've added a beautiful and user-friendly web interface that makes downloading music from Apple Music easier than ever!

### ✨ Features

- **Visual Interface**: Modern, responsive web UI with a clean design
- **Auto Dependency Check**: Automatically checks if required dependencies are installed
- **Dependency Installation**: Guided installation for MP4Box, mp4decrypt, and ffmpeg
- **Easy Configuration**: Configure all settings through the web interface
- **Search Functionality**: Search for songs, albums, or artists directly from the UI
- **Real-time Progress**: Track download progress with visual indicators
- **Multiple Quality Options**: Choose between ALAC (Lossless), AAC, or Dolby Atmos

### 🚀 Quick Start

#### Method 1: Using Startup Scripts (Recommended)

**On Linux/Mac:**
```bash
./start-web.sh
```

**On Windows:**
```
start-web.bat
```

The script will:
1. Check if Go is installed
2. Build the application if needed
3. Check dependencies
4. Start the web server on port 8080 (default)

#### Method 2: Manual Start

```bash
# Build the application
go build -o am-dl

# Start the web server
./am-dl --web

# Or specify a custom port
./am-dl --web --port 3000
```

### 📝 Usage

1. **Start the Web Server**
   ```bash
   ./start-web.sh
   ```
   Or on Windows:
   ```
   start-web.bat
   ```

2. **Open Your Browser**
   Navigate to `http://localhost:8080`

3. **Check Dependencies**
   The interface will automatically check if required dependencies are installed:
   - MP4Box
   - mp4decrypt
   - ffmpeg
   - Wrapper service

4. **Configure Settings** (Optional)
   - Click "Edit Config" to set your media-user-token, storefront, and save folder
   - Click "Save Config" to apply changes

5. **Download Music**
   
   **Option A: URL Download**
   - Paste an Apple Music URL (album, song, playlist, or artist)
   - Select quality (ALAC, AAC, or Dolby Atmos)
   - Configure options (lyrics, cover art, etc.)
   - Click "Start Download"

   **Option B: Search**
   - Switch to the "Search" tab
   - Select search type (Song, Album, or Artist)
   - Enter search query
   - Click "Search"
   - Select a result from the list
   - The URL will be automatically filled

6. **Monitor Progress**
   - Real-time progress bar
   - Detailed log of download status
   - Success/error notifications

### 🔧 Dependencies

The web interface can help you install dependencies automatically (on Linux/Mac with package managers). For manual installation:

#### Required Dependencies

1. **MP4Box** - Required for media processing
   - Download: https://gpac.io/downloads/gpac-nightly-builds/
   - Installation: Add to system PATH

2. **mp4decrypt** - Required for MV downloads
   - Download: https://www.bento4.com/downloads/
   - Installation: Add to system PATH

3. **ffmpeg** - Optional but recommended for animated artwork and format conversion
   - Download: https://ffmpeg.org/download.html
   - Installation: Add to system PATH

4. **Wrapper Service** - Required for decryption
   - GitHub: https://github.com/zhaarey/wrapper
   - Must be running on port 10020

### 🎯 Features Comparison

| Feature | Web GUI | Command Line |
|---------|---------|--------------|
| Easy to Use | ✅ | ⚠️ |
| Dependency Checking | ✅ | ❌ |
| Auto Installation | ✅ (Linux/Mac) | ❌ |
| Real-time Progress | ✅ | ✅ |
| Search Functionality | ✅ | ✅ |
| Configuration UI | ✅ | ❌ |
| Batch Download | ✅ | ✅ |

### 🌐 Browser Support

- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Opera

### 🔐 Security Notes

- The web server runs locally on your machine
- No data is sent to external servers
- Your media-user-token is stored locally in config.yaml
- Access the interface only from `localhost` for security

### 💡 Tips

1. **First Time Setup**: Configure your media-user-token through the web interface for lyrics and AAC-LC downloads
2. **Wrapper Service**: Make sure the wrapper service is running before downloading
3. **Quality Selection**: Choose the quality that best fits your needs and storage space
4. **Batch Downloads**: You can queue multiple downloads by pasting album or playlist URLs

### 🐛 Troubleshooting

**Issue**: Web server won't start
- Solution: Check if port 8080 is already in use, try a different port: `./am-dl --web --port 3000`

**Issue**: Dependencies not detected
- Solution: Ensure the dependencies are in your system PATH

**Issue**: Download fails
- Solution: Check if wrapper service is running on port 10020

**Issue**: Can't access web interface
- Solution: Make sure you're accessing `http://localhost:8080` not from a different machine

---

## 简体中文

### 🎉 新功能：友好的可视化界面

我们添加了一个漂亮且用户友好的Web界面，让从Apple Music下载音乐变得前所未有的简单！

### ✨ 特性

- **可视化界面**：现代化、响应式的Web UI，设计简洁
- **自动依赖检查**：自动检查所需依赖是否已安装
- **依赖安装**：提供MP4Box、mp4decrypt和ffmpeg的安装指导
- **简易配置**：通过Web界面配置所有设置
- **搜索功能**：直接从UI搜索歌曲、专辑或艺术家
- **实时进度**：使用可视化指示器跟踪下载进度
- **多种质量选项**：在ALAC（无损）、AAC或杜比全景声之间选择

### 🚀 快速开始

#### 方法1：使用启动脚本（推荐）

**在 Linux/Mac 上：**
```bash
./start-web.sh
```

**在 Windows 上：**
```
start-web.bat
```

脚本将：
1. 检查Go是否已安装
2. 如需要则构建应用程序
3. 检查依赖项
4. 在8080端口（默认）启动Web服务器

#### 方法2：手动启动

```bash
# 构建应用程序
go build -o am-dl

# 启动Web服务器
./am-dl --web

# 或指定自定义端口
./am-dl --web --port 3000
```

### 📝 使用方法

1. **启动Web服务器**
   ```bash
   ./start-web.sh
   ```
   或在Windows上：
   ```
   start-web.bat
   ```

2. **打开浏览器**
   访问 `http://localhost:8080`

3. **检查依赖项**
   界面会自动检查所需依赖项是否已安装：
   - MP4Box
   - mp4decrypt
   - ffmpeg
   - Wrapper服务

4. **配置设置**（可选）
   - 点击"Edit Config"设置您的media-user-token、storefront和保存文件夹
   - 点击"Save Config"应用更改

5. **下载音乐**
   
   **选项A：URL下载**
   - 粘贴Apple Music URL（专辑、歌曲、播放列表或艺术家）
   - 选择质量（ALAC、AAC或杜比全景声）
   - 配置选项（歌词、封面艺术等）
   - 点击"Start Download"

   **选项B：搜索**
   - 切换到"Search"标签
   - 选择搜索类型（歌曲、专辑或艺术家）
   - 输入搜索查询
   - 点击"Search"
   - 从列表中选择结果
   - URL将自动填充

6. **监控进度**
   - 实时进度条
   - 详细的下载状态日志
   - 成功/错误通知

### 🔧 依赖项

Web界面可以帮助您自动安装依赖项（在有包管理器的Linux/Mac上）。手动安装：

#### 必需的依赖项

1. **MP4Box** - 媒体处理所需
   - 下载：https://gpac.io/downloads/gpac-nightly-builds/
   - 安装：添加到系统PATH

2. **mp4decrypt** - MV下载所需
   - 下载：https://www.bento4.com/downloads/
   - 安装：添加到系统PATH

3. **ffmpeg** - 可选但推荐，用于动画封面和格式转换
   - 下载：https://ffmpeg.org/download.html
   - 安装：添加到系统PATH

4. **Wrapper服务** - 解密所需
   - GitHub：https://github.com/zhaarey/wrapper
   - 必须在10020端口运行

### 🎯 功能对比

| 功能 | Web界面 | 命令行 |
|------|---------|--------|
| 易于使用 | ✅ | ⚠️ |
| 依赖检查 | ✅ | ❌ |
| 自动安装 | ✅（Linux/Mac）| ❌ |
| 实时进度 | ✅ | ✅ |
| 搜索功能 | ✅ | ✅ |
| 配置UI | ✅ | ❌ |
| 批量下载 | ✅ | ✅ |

### 🌐 浏览器支持

- Chrome（推荐）
- Firefox
- Safari
- Edge
- Opera

### 🔐 安全说明

- Web服务器在您的计算机上本地运行
- 不会将数据发送到外部服务器
- 您的media-user-token存储在本地的config.yaml中
- 为了安全，仅从`localhost`访问界面

### 💡 提示

1. **首次设置**：通过Web界面配置您的media-user-token，以便下载歌词和AAC-LC
2. **Wrapper服务**：下载前确保wrapper服务正在运行
3. **质量选择**：选择最适合您需求和存储空间的质量
4. **批量下载**：可以通过粘贴专辑或播放列表URL来排队多个下载

### 🐛 故障排除

**问题**：Web服务器无法启动
- 解决方案：检查8080端口是否已被占用，尝试不同的端口：`./am-dl --web --port 3000`

**问题**：未检测到依赖项
- 解决方案：确保依赖项在系统PATH中

**问题**：下载失败
- 解决方案：检查wrapper服务是否在10020端口运行

**问题**：无法访问Web界面
- 解决方案：确保您正在访问`http://localhost:8080`而不是从其他机器访问
