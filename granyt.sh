#!/bin/bash

# Granyt Installation Script
# This script installs Docker, downloads the Granyt standalone docker-compose file,
# configures environment variables, and starts the deployment.

set -e

# Check if running on Linux
if [[ "$(uname)" == *"MINGW"* ]] || [[ "$(uname)" == *"MSYS"* ]] || [[ "$(uname)" == *"CYGWIN"* ]]; then
    echo "Error: Windows is not supported by this script. Please use a Linux distribution."
    exit 1
fi

echo "--- Granyt Installation ---"

# Function to generate secure secrets
generate_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex "$1"
    else
        # Fallback if openssl is not available
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w "$(( $1 * 2 ))" | head -n 1
    fi
}

# 1. Install Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker using the official convenience script..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # Try to add current user to docker group (might require logout/login to take effect, 
    # but we'll use sudo for the rest of the script if needed or just hope for the best)
    sudo usermod -aG docker $USER || true
    rm get-docker.sh
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# 2. Download docker-compose.standalone.yml
COMPOSE_FILE="docker-compose.standalone.yml"
# Using the raw URL to download the file directly
URL="https://raw.githubusercontent.com/jhKessler/getgranyt/main/granyt-app/docker-compose.standalone.yml"

echo "Downloading $COMPOSE_FILE..."
if command -v curl &> /dev/null; then
    curl -L "$URL" -o "$COMPOSE_FILE"
elif command -v wget &> /dev/null; then
    wget -O "$COMPOSE_FILE" "$URL"
else
    echo "Error: Neither curl nor wget found. Please install one of them."
    exit 1
fi

# 3. Ask for URL
echo ""
echo "Please enter the URL the dashboard should be running on (e.g., https://granyt.yourdomain.com)."
echo "You can leave it empty for now and change the BETTER_AUTH_URL in the .env file later."
read -p "Dashboard URL [leave empty for auto-detect]: " DASHBOARD_URL

# 4. Generate Secrets
echo "Generating secure secrets..."
POSTGRES_PASSWORD=$(generate_secret 16)
BETTER_AUTH_SECRET=$(generate_secret 32)

# 5. Handle Empty Domain
if [ -z "$DASHBOARD_URL" ]; then
    echo "No URL provided. Detecting public IP..."
    PUBLIC_IP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || echo "localhost")
    DASHBOARD_URL="http://$PUBLIC_IP:3000"
    echo "Using $DASHBOARD_URL as the default URL."
fi

# 6. Write .env file
echo "Generating .env file..."
cat <<EOF > .env
POSTGRES_USER=granyt
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=granyt
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
BETTER_AUTH_URL=$DASHBOARD_URL
APP_PORT=3000
EOF

# 7. Build and start docker compose
echo "Starting Granyt deployment in detached mode..."
# We use sudo here to ensure it works even if the user hasn't logged out/in after group change
if command -v docker-compose &> /dev/null; then
    sudo docker-compose -f "$COMPOSE_FILE" up -d
else
    sudo docker compose -f "$COMPOSE_FILE" up -d
fi

# 8. Health check
echo "Waiting for Granyt to be online (this may take up to 5 minutes)..."
HEALTH_URL="http://localhost:3000/api/health"
MAX_RETRIES=60 # 60 * 5 seconds = 300 seconds (5 minutes)
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Check if the health endpoint returns status: ok
    if curl -s "$HEALTH_URL" | grep -q '"status":"ok"'; then
        SUCCESS=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 5
done

if [ "$SUCCESS" = true ]; then
    echo ""
    echo "---------------------------------------------------"
    echo "Success! Your Granyt deployment is online at $DASHBOARD_URL"
    echo "---------------------------------------------------"
else
    echo ""
    echo "Health check timed out after 5 minutes."
    echo "Please check the container logs to see what went wrong:"
    echo "sudo docker compose -f $COMPOSE_FILE logs"
fi
