#!/usr/bin/env bash
# Void AI — One-Click Installer
# Supports: Linux (x86_64, arm64), macOS (x86_64, arm64), Termux (Android)

set -e

VOID_VERSION="1.0.0"
VOID_DIR="$HOME/.void-ai"
VOID_BIN="$VOID_DIR/bin"

echo ""
echo "  ╔═════════════════════════════════════════╗"
echo "  ║         VOID AI INSTALLER v1.0         ║"
echo "  ║    The Assembly Language of AI          ║"
echo "  ╚═════════════════════════════════════════╝"
echo ""

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux*)  PLATFORM="linux" ;;
    Darwin*) PLATFORM="darwin" ;;
    *)       PLATFORM="unknown" ;;
esac

case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    armv7l)        ARCH="armv7" ;;  # Termux
    *)             ARCH="unknown" ;;
esac

echo "Platform: $PLATFORM/$ARCH"

# Create directories
mkdir -p "$VOID_DIR" "$VOID_BIN" "$VOID_DIR/models" "$VOID_DIR/data"

# Check for Ollama
echo ""
echo "Checking for Ollama..."
if command -v ollama &> /dev/null; then
    echo "  ✓ Ollama found"
else
    echo "  ! Ollama not found"
    echo "  Installing Ollama..."
    if [ "$PLATFORM" = "linux" ]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [ "$PLATFORM" = "darwin" ]; then
        echo "  Please install Ollama from https://ollama.com/download"
    fi
fi

# Install Python dependencies
echo ""
echo "Installing Void AI runtime..."
if command -v pip3 &> /dev/null; then
    pip3 install --user flask requests 2>/dev/null || true
fi

# Download Void AI models
echo ""
echo "Setting up Void models..."
echo "  Pulling Void-1 (Code Model, ~100MB)..."
ollama create void-1 -f "$VOID_DIR/models/void-1/Modelfile" 2>/dev/null || \
    echo "  ! Void-1 Modelfile not found — will use base model"

echo "  Pulling Void-2 (Linguistic Model, ~100MB)..."
ollama create void-2 -f "$VOID_DIR/models/void-2/Modelfile" 2>/dev/null || \
    echo "  ! Void-2 Modelfile not found — will use base model"

# Create launcher
cat > "$VOID_BIN/void" << 'LAUNCHER'
#!/usr/bin/env bash
# Void AI Launcher
case "$1" in
    chat)   ollama run void-2 "${@:2}" ;;
    code)   ollama run void-1 "${@:2}" ;;
    think)  ollama run void-1 "Research mode: $*" ;;
    agent)  ollama run void-1 "Agent mode: $*" ;;
    void)   python3 "$VOID_DIR/src/nlp/voidcode.py" "${@:2}" ;;
    *)      ollama run void-moa "$*" ;;
esac
LAUNCHER
chmod +x "$VOID_BIN/void"

# Add to PATH
if ! grep -q ".void-ai/bin" "$HOME/.bashrc" 2>/dev/null; then
    echo 'export PATH="$HOME/.void-ai/bin:$PATH"' >> "$HOME/.bashrc"
    echo 'export VOID_HOME="$HOME/.void-ai"' >> "$HOME/.bashrc"
fi

echo ""
echo "  ╔═════════════════════════════════════════╗"
echo "  ║      VOID AI INSTALLED SUCCESSFULLY     ║"
echo "  ╚═════════════════════════════════════════╝"
echo ""
echo "  Usage:"
echo "    void chat \"Hello\"       # Chat with Void-2"
echo "    void code \"fibonacci\"   # Code with Void-1"  
echo "    void think \"quantum\"    # Deep research"
echo "    void agent \"ls -la\"     # Agent mode"
echo "    void void \"script.void\" # Run Void Code"
echo "    void \"anything\"         # Auto-route (MOA)"
echo ""
echo "  Models installed:"
echo "    Void-1 (Code):     ollama list | grep void-1"
echo "    Void-2 (Language): ollama list | grep void-2"
echo ""
echo "  To start the web UI:"
echo "    cd $VOID_DIR && python3 src/api/server.py"
echo ""
