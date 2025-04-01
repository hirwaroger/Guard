#!/bin/bash

# Stop on errors
set -e

echo "===== MyGuard Smart Contract Analyzer - Deploy Script ====="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Make sure dfx is running
echo "Checking if dfx replica is running..."
dfx ping || {
  echo "Starting Internet Computer replica..."
  dfx start --background
  sleep 2
}

# Remove artifacts that might cause issues
echo "Cleaning up previous build artifacts..."
rm -rf .dfx/local/canisters/myGuard_backend/myGuard_backend.wasm

# Create the canisters if they don't exist yet
echo "Ensuring canisters are created..."
dfx canister create --all || true

# Build the Rust backend directly
echo "Building Rust backend..."
cargo build --target wasm32-unknown-unknown --release --package myGuard_backend

# Make sure the directory exists
mkdir -p .dfx/local/canisters/myGuard_backend/

# Copy the wasm to the .dfx directory
cp target/wasm32-unknown-unknown/release/myGuard_backend.wasm .dfx/local/canisters/myGuard_backend/

# Install the wasm module to the canister
echo "Installing backend canister..."
dfx canister install --mode=reinstall myGuard_backend

# Build and install the frontend
echo "Building and installing frontend..."
dfx deploy myGuard_frontend

# Show URLs
echo ""
echo "===== Deployment Complete ====="
FRONTEND_ID=$(dfx canister id myGuard_frontend)
BACKEND_ID=$(dfx canister id myGuard_backend)
echo "Frontend canister: $FRONTEND_ID"
echo "Backend canister: $BACKEND_ID"
echo "Your application is available at: http://localhost:4943/?canisterId=$FRONTEND_ID"

echo ""
echo "You can also use these commands to interact with your canisters:"
echo "- Check dataset size: dfx canister call myGuard_backend get_dataset_size"
echo "- Test greeting: dfx canister call myGuard_backend greet '(\"World\")'"
