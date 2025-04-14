#!/bin/bash

# Define colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a styled message
print_message() {
    echo -e "${BLUE}==>${NC} $1"
}

# Print a success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print a warning message
print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Print an error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python version
check_python() {
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.8 or newer."
        return 1
    fi

    python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')

    # Extract major and minor version numbers
    major_version=$(echo $python_version | cut -d. -f1)
    minor_version=$(echo $python_version | cut -d. -f2)

    # Check if version is at least 3.8
    if [ "$major_version" -lt 3 ] || ([ "$major_version" -eq 3 ] && [ "$minor_version" -lt 8 ]); then
        print_error "Python version $python_version detected. This project requires Python 3.8+."
        return 1
    fi

    print_success "Python $python_version detected."
    return 0
}

# Set up virtual environment
setup_venv() {
    if [ -d "venv" ]; then
        print_message "Virtual environment already exists."
    else
        print_message "Creating virtual environment..."
        python3 -m venv venv
        if [ $? -ne 0 ]; then
            print_error "Failed to create virtual environment."
            return 1
        fi
        print_success "Virtual environment created."
    fi

    print_message "Activating virtual environment..."
    source venv/bin/activate
    if [ $? -ne 0 ]; then
        print_error "Failed to activate virtual environment."
        return 1
    fi
    print_success "Virtual environment activated."
    return 0
}

# Install dependencies
install_dependencies() {
    print_message "Checking dependencies..."

    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found."
        return 1
    fi

    # Check if requirements are already installed
    pip freeze | grep -q "flask=="
    if [ $? -eq 0 ]; then
        print_success "Dependencies already installed."
    else
        print_message "Installing dependencies from requirements.txt..."
        pip install -r requirements.txt
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies."
            return 1
        fi
        print_success "Dependencies installed successfully."
    fi
    return 0
}

# Check if server.py exists
check_server() {
    if [ ! -f "api/server.py" ]; then
        print_error "Server file (api/server.py) not found."
        return 1
    fi
    print_success "Server file found."
    return 0
}

# Check if the server port is available
check_port() {
    if command_exists lsof; then
        lsof -i :5000 > /dev/null
        if [ $? -eq 0 ]; then
            print_warning "Port 5000 is already in use. The server might not start correctly."
        else
            print_success "Port 5000 is available."
        fi
    fi
}

# Start the server
start_server() {
    print_message "Starting Conlang Lexicon Manager server..."
    python3 api/server.py
}

# Open the app in browser (optional, macOS specific)
open_browser() {
    if command_exists open; then
        # Wait for the server to start
        sleep 2
        print_message "Opening application in browser..."
        open http://localhost:5000
    fi
}

# Main function
main() {
    print_message "Setting up Conlang Lexicon Manager..."

    # Check prerequisites
    check_python || return 1

    # Setup environment
    setup_venv || return 1
    install_dependencies || return 1
    check_server || return 1
    check_port

    # Start the application
    echo ""
    print_message "Setup complete. Starting server..."
    echo ""
    trap 'echo -e "\n${YELLOW}Server stopped.${NC}"' INT
    start_server
}

# Run the main function
main