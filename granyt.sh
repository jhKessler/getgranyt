#!/bin/sh

# Granyt Deployment Script
# This script installs Docker, downloads the Granyt standalone docker-compose file,
# configures environment variables, and starts the deployment.
#
# Full source code: https://github.com/jhKessler/getgranyt
# Report issues:    https://github.com/jhKessler/getgranyt/issues
# Security policy:  https://github.com/jhKessler/getgranyt/blob/main/granyt-app/SECURITY.md
#
# Usage: curl -fsSL https://granyt.sh | sh
#    or: ./granyt.sh [--help] [--dry-run]

set -eu

# Ensure we're running in a safe umask
umask 077

# =========================
# Command Line Arguments
# =========================
DRY_RUN=false

show_help() {
    printf "Granyt Deployment Script\n\n"
    printf "Usage: ./granyt.sh [OPTIONS]\n\n"
    printf "Options:\n"
    printf "  --help, -h     Show this help message and exit\n"
    printf "  --dry-run      Show what would be done without making changes\n\n"
    printf "Environment variables:\n"
    printf "  GRANYT_URL     Pre-set the dashboard URL (skips prompt)\n\n"
    printf "What this script does:\n"
    printf "  1. Checks for Docker (optionally installs it)\n"
    printf "  2. Downloads docker-compose.standalone.yml from GitHub\n"
    printf "  3. Prompts for your dashboard URL\n"
    printf "  4. Generates secure secrets for Postgres and auth\n"
    printf "  5. Creates a .env configuration file\n"
    printf "  6. Starts Granyt containers with Docker Compose\n\n"
    printf "More info: https://github.com/jhKessler/getgranyt\n"
}

for arg in "$@"; do
    case "$arg" in
        --help|-h)
            show_help
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        -*)
            printf "Unknown option: %s\n" "$arg"
            printf "Use --help to see available options.\n"
            exit 1
            ;;
    esac
done

# =========================
# Colors and Formatting
# =========================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# =========================
# Helper Functions
# =========================
print_step() {
    printf "${BLUE}${BOLD}[%s/$TOTAL_STEPS]${NC} %s\n" "$1" "$2"
}

print_success() {
    printf "    ${GREEN}✓${NC} %s\n" "$1"
}

print_error() {
    printf "    ${RED}✗${NC} %s\n" "$1"
}

print_info() {
    printf "    ${DIM}%s${NC}\n" "$1"
}

# Spinner for long operations
spinner() {
    pid=$1
    message=$2
    chars="⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏"
    
    while kill -0 "$pid" 2>/dev/null; do
        for char in $chars; do
            printf "\r    ${CYAN}%s${NC} %s" "$char" "$message"
            sleep 0.1
            if ! kill -0 "$pid" 2>/dev/null; then
                break
            fi
        done
    done
    printf "\r"
}

# Function to generate secure secrets
generate_secret() {
    length="${1:-32}"
    secret=""
    if command -v openssl > /dev/null 2>&1; then
        secret=$(openssl rand -hex "$length" 2>/dev/null | tr -dc 'a-f0-9')
    fi

    if [ -z "$secret" ]; then
        secret=$(head -c "$((length * 2))" /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c "$((length * 2))")
    fi
    
    # Check secret length using expr instead of ${#var}
    secret_len=$(printf '%s' "$secret" | wc -c)
    if [ -z "$secret" ] || [ "$secret_len" -lt "$((length * 2))" ]; then
        print_error "Failed to generate secure secret"
        exit 1
    fi
    echo "$secret"
}

# Function to validate URL format
validate_url() {
    url="$1"
    # Stricter URL validation using POSIX-compliant checks
    # Must start with http:// or https://
    case "$url" in
        http://*|https://*) ;;
        *) return 1 ;;
    esac
    
    # Extract domain (remove protocol and path)
    domain=$(printf '%s' "$url" | sed 's|^https*://||' | sed 's|[:/].*||')
    
    # Check domain is not empty
    if [ -z "$domain" ]; then
        return 1
    fi
    
    # Reject URLs with consecutive dots or hyphens in domain
    case "$domain" in
        *..* | *--*) return 1 ;;
    esac
    
    # Validate domain contains only allowed characters (alphanumeric, dots, hyphens)
    clean_domain=$(printf '%s' "$domain" | tr -dc 'a-zA-Z0-9.-')
    if [ "$domain" != "$clean_domain" ]; then
        return 1
    fi
    
    return 0
}

# Global cleanup function
cleanup() {
    exit_code=$?
    # Remove any temp files that might exist
    rm -f "$DOCKER_SCRIPT" 2>/dev/null || true
    rm -f "$TEMP_COMPOSE" 2>/dev/null || true
    rm -f "$COMPOSE_OUTPUT" 2>/dev/null || true
    exit $exit_code
}

# Initialize temp file variables
DOCKER_SCRIPT=""
TEMP_COMPOSE=""
COMPOSE_OUTPUT=""

# Set up global trap for cleanup
trap cleanup EXIT INT TERM

TOTAL_STEPS=6

# =========================
# Banner
# =========================
printf "\n"
printf "${CYAN}${BOLD}"
cat << "EOF"
   _____ _____            _   ___     _________ 
  / ____|  __ \     /\   | \ | \ \   / /__   __|
 | |  __| |__) |   /  \  |  \| |\ \_/ /   | |   
 | | |_ |  _  /   / /\ \ | . ` | \   /    | |   
 | |__| | | \ \  / ____ \| |\  |  | |     | |   
  \_____|_|  \_\/_/    \_\_| \_|  |_|     |_|   
                                                
EOF
printf "${NC}\n"
printf "${BOLD}  Let's rock this deployment! 🪨${NC}\n"
printf "\n"
printf "${DIM}  ─────────────────────────────────────────────${NC}\n"
printf "\n"

# =========================
# Transparency Preamble
# =========================
if [ "$DRY_RUN" = true ]; then
    printf "${YELLOW}${BOLD}  DRY RUN MODE${NC} - No changes will be made\n\n"
fi

printf "${BOLD}  This script will:${NC}\n"
printf "    ${DIM}•${NC} Check for Docker (optionally install it)\n"
printf "    ${DIM}•${NC} Download docker-compose.standalone.yml from GitHub\n"
printf "    ${DIM}•${NC} Generate secure secrets for your installation\n"
printf "    ${DIM}•${NC} Create a .env file with your configuration\n"
printf "    ${DIM}•${NC} Start Granyt containers\n"
printf "\n"
printf "${DIM}  Source: https://github.com/jhKessler/getgranyt${NC}\n"
printf "\n"
printf "  Press ${BOLD}Enter${NC} to continue or ${BOLD}Ctrl+C${NC} to cancel... "
read _ < /dev/tty || true
printf "\n"

# =========================
# Check OS
# =========================
case "$(uname)" in
    *MINGW*|*MSYS*|*CYGWIN*)
        print_error "Windows is not supported. Please use a Linux distribution."
        exit 1
        ;;
esac

# =========================
# Step 1: Check/Install Docker
# =========================
print_step 1 "Checking Docker..."

if ! command -v docker > /dev/null 2>&1; then
    print_info "Docker not found."
    printf "\n"
    printf "    ${YELLOW}Would you like to install Docker automatically?${NC}\n"
    printf "    ${DIM}This will run the official Docker installation script.${NC}\n"
    printf "\n"
    printf "    Install Docker? [y/N]: "
    read INSTALL_DOCKER < /dev/tty
    
    case "$INSTALL_DOCKER" in
        [yY]|[yY][eE][sS])
            print_info "Installing Docker..."
            
            # Create secure temp file for docker install script
            DOCKER_SCRIPT=$(mktemp) || { print_error "Failed to create temp file"; exit 1; }
            
            if ! curl -fsSL --proto '=https' --tlsv1.2 "https://get.docker.com" -o "$DOCKER_SCRIPT"; then
                print_error "Failed to download Docker installation script"
                exit 1
            fi
            
            # Verify the script looks legitimate (basic sanity check)
            if ! grep -q "docker" "$DOCKER_SCRIPT" || ! grep -q "install" "$DOCKER_SCRIPT"; then
                print_error "Downloaded Docker script appears invalid or corrupted"
                exit 1
            fi
            
            # Warn user about running third-party script
            print_info "About to run Docker's official install script from get.docker.com"
            print_info "Review at: https://github.com/docker/docker-install"
            
            # Run the docker install script
            if [ "$DRY_RUN" = true ]; then
                print_info "[DRY RUN] Would run: sudo sh $DOCKER_SCRIPT"
                print_info "[DRY RUN] Would add user to docker group"
                rm -f "$DOCKER_SCRIPT"
                DOCKER_SCRIPT=""
                print_success "Docker would be installed"
            else
                if ! sudo sh "$DOCKER_SCRIPT"; then
                    print_error "Docker installation failed"
                    exit 1
                fi
                
                rm -f "$DOCKER_SCRIPT"
                DOCKER_SCRIPT=""
                
                # Add current user to docker group
                sudo usermod -aG docker "$(id -un)" 2>/dev/null || true
                
                print_success "Docker installed"
            fi
            print_info "Note: You may need to log out and back in for group changes to take effect."
            ;;
        *)
            print_info "Please install Docker manually from https://docs.docker.com/engine/install/"
            print_info "Then re-run this script."
            exit 1
            ;;
    esac
else
    print_success "Docker's good to go"
fi

# =========================
# Step 2: Download docker-compose file
# =========================
print_step 2 "Grabbing the docker-compose file..."

COMPOSE_FILE="docker-compose.standalone.yml"
URL="https://raw.githubusercontent.com/jhKessler/getgranyt/main/granyt-app/docker-compose.standalone.yml"

# Create a temporary file securely
TEMP_COMPOSE=$(mktemp) || { print_error "Failed to create temp file"; exit 1; }

if command -v curl > /dev/null 2>&1; then
    if ! curl -fsSL --proto '=https' --tlsv1.2 "$URL" -o "$TEMP_COMPOSE"; then
        print_error "Failed to download docker-compose file"
        exit 1
    fi
elif command -v wget > /dev/null 2>&1; then
    if ! wget --https-only -qO "$TEMP_COMPOSE" "$URL"; then
        print_error "Failed to download docker-compose file"
        exit 1
    fi
else
    print_error "Neither curl nor wget found. Please install one of them."
    exit 1
fi

# Verify it looks like a valid compose file (basic sanity checks)
if ! grep -q "services:" "$TEMP_COMPOSE"; then
    print_error "Downloaded file doesn't appear to be a valid docker-compose file"
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    print_info "[DRY RUN] Would save to: $COMPOSE_FILE"
    rm -f "$TEMP_COMPOSE"
    TEMP_COMPOSE=""
    print_success "Validated (not saved in dry-run mode)"
else
    mv "$TEMP_COMPOSE" "$COMPOSE_FILE"
    TEMP_COMPOSE=""
    print_success "Got it"
fi

# =========================
# Step 3: Ask for URL
# =========================
print_step 3 "Where will your dashboard live?"
printf "\n"
printf "    ${DIM}Enter the domain you will be accessing Granyt through (e.g., granyt.yourdomain.com)${NC}\n"
printf "    ${DIM}Leave empty to use your server's IP address${NC}\n"
printf "\n"
printf "    URL (optional): "
read DASHBOARD_URL < /dev/tty

if [ -z "$DASHBOARD_URL" ]; then
    # No input - use detected IP
    PUBLIC_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || hostname -I | awk '{print $1}')
    
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP="localhost"
    fi
    
    DASHBOARD_URL="http://$PUBLIC_IP:3000"
else
    # Auto-prepend https:// if no protocol specified
    case "$DASHBOARD_URL" in
        http://*|https://*)
            # Already has protocol, use as-is
            ;;
        *)
            # No protocol, prepend https://
            DASHBOARD_URL="https://$DASHBOARD_URL"
            ;;
    esac
fi

# Validate the provided URL
if ! validate_url "$DASHBOARD_URL"; then
    print_error "Invalid URL format. Please use format: https://example.com or http://192.168.1.1:3000"
    exit 1
fi

print_success "Using $DASHBOARD_URL"

# =========================
# Step 4: Generate Secrets
# =========================
print_step 4 "Generating secrets too hard to crack! 🔐"

POSTGRES_PASSWORD=$(generate_secret 16)
BETTER_AUTH_SECRET=$(generate_secret 32)

print_success "Secrets generated"

# =========================
# Step 5: Write .env file
# =========================
print_step 5 "Writing your config..."

# Check if .env already exists
if [ -f ".env" ]; then
    print_error "Installation stopped: A .env file already exists in this directory."
    print_info "Granyt may have already been installed here."
    print_info "To reinstall, first remove or rename the existing .env file:"
    print_info "  mv .env .env.backup"
    exit 1
fi

# Sanitize DASHBOARD_URL - remove any newlines or shell metacharacters
# This prevents injection attacks via the URL
SANITIZED_URL=$(printf '%s' "$DASHBOARD_URL" | tr -d '\n\r' | sed "s/[^a-zA-Z0-9:/.?&#=-]//g")

# Write .env with restrictive permissions atomically
# Use a temp file and mv to avoid TOCTOU race condition
ENV_TEMP=$(mktemp .env.XXXXXX) || { print_error "Failed to create temp file for .env"; exit 1; }
chmod 600 "$ENV_TEMP"

cat <<EOF > "$ENV_TEMP"
POSTGRES_USER=granyt
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=granyt
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=$SANITIZED_URL
APP_PORT=3000
EOF

# Atomic move - prevents race condition where file exists with wrong permissions
if [ "$DRY_RUN" = true ]; then
    print_info "[DRY RUN] Would create .env with:"
    print_info "  POSTGRES_USER=granyt"
    print_info "  POSTGRES_PASSWORD=<generated>"
    print_info "  POSTGRES_DB=granyt"
    print_info "  BETTER_AUTH_SECRET=<generated>"
    print_info "  BETTER_AUTH_URL=$SANITIZED_URL"
    print_info "  APP_PORT=3000"
    rm -f "$ENV_TEMP"
    print_success ".env file would be created (permissions: 600)"
else
    mv "$ENV_TEMP" .env
    print_success ".env file created (permissions: 600)"
fi

# =========================
# Step 6: Start containers
# =========================
print_step 6 "Spinning up the containers..."

# Determine the compose command
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    print_error "Neither 'docker compose' nor 'docker-compose' was found."
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    print_info "[DRY RUN] Would run: $COMPOSE_CMD -f $COMPOSE_FILE up -d"
    print_success "Containers would be started"
    
    printf "\n"
    printf "${YELLOW}${BOLD}┌─────────────────────────────────────────────────┐${NC}\n"
    printf "${YELLOW}${BOLD}│${NC}  ${YELLOW}DRY RUN COMPLETE${NC}                              ${YELLOW}${BOLD}│${NC}\n"
    printf "${YELLOW}${BOLD}│${NC}                                                 ${YELLOW}${BOLD}│${NC}\n"
    printf "${YELLOW}${BOLD}│${NC}  ${DIM}No changes were made to your system.${NC}          ${YELLOW}${BOLD}│${NC}\n"
    printf "${YELLOW}${BOLD}│${NC}  ${DIM}Run without --dry-run to install.${NC}             ${YELLOW}${BOLD}│${NC}\n"
    printf "${YELLOW}${BOLD}└─────────────────────────────────────────────────┘${NC}\n"
    printf "\n"
    exit 0
fi

# Try running without sudo first, then with sudo if it fails
COMPOSE_OUTPUT=$(mktemp) || { print_error "Failed to create temp file"; exit 1; }
chmod 600 "$COMPOSE_OUTPUT"

if ! $COMPOSE_CMD -f "$COMPOSE_FILE" up -d > "$COMPOSE_OUTPUT" 2>&1; then
    print_info "Need sudo for Docker..."
    if ! sudo $COMPOSE_CMD -f "$COMPOSE_FILE" up -d > "$COMPOSE_OUTPUT" 2>&1; then
        print_error "Failed to start containers. Error output:"
        cat "$COMPOSE_OUTPUT"
        exit 1
    fi
fi
rm -f "$COMPOSE_OUTPUT"
COMPOSE_OUTPUT=""

print_success "Containers started"

# =========================
# Health Check with Spinner
# =========================
printf "\n"
printf "${BLUE}${BOLD}[...]${NC} Waiting for Granyt to come online...\n"
printf "\n"

# Health check uses localhost only (never exposed externally)
HEALTH_URL="http://127.0.0.1:3000/api/health"
MAX_RETRIES=60
RETRY_COUNT=0
SUCCESS=false

# Start background health check
(
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s "$HEALTH_URL" | grep -q '"status":"ok"'; then
            exit 0
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 5
    done
    exit 1
) &
HEALTH_PID=$!

# Show spinner while waiting
spinner $HEALTH_PID "This might take a minute or two..."

# Check result
wait $HEALTH_PID
HEALTH_EXIT=$?

if [ $HEALTH_EXIT -eq 0 ]; then
    printf "\n"
    printf "${GREEN}${BOLD}┌─────────────────────────────────────────────────┐${NC}\n"
    printf "${GREEN}${BOLD}│${NC}  ${GREEN}✓${NC} ${BOLD}Granyt is live!${NC}                              ${GREEN}${BOLD}│${NC}\n"
    printf "${GREEN}${BOLD}│${NC}                                                 ${GREEN}${BOLD}│${NC}\n"
    printf "${GREEN}${BOLD}│${NC}  Register: ${CYAN}%s/register${NC}\n" "$DASHBOARD_URL"
    printf "${GREEN}${BOLD}└─────────────────────────────────────────────────┘${NC}\n"
    printf "\n"
else
    printf "\n"
    printf "${RED}${BOLD}┌─────────────────────────────────────────────────┐${NC}\n"
    printf "${RED}${BOLD}│${NC}  ${RED}✗${NC} ${BOLD}Something went wrong${NC}                         ${RED}${BOLD}│${NC}\n"
    printf "${RED}${BOLD}└─────────────────────────────────────────────────┘${NC}\n"
    printf "\n"
    printf "    Check the logs:\n"
    printf "    ${DIM}sudo docker compose -f %s logs${NC}\n" "$COMPOSE_FILE"
    printf "\n"
fi
