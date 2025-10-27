#!/bin/bash

# ==============================================================
# UPSC Portal Project Structure Setup Script
# Author: ChatGPT Assistant
# Description: Creates folder structure for React + Bootstrap hybrid app
# ==============================================================

# Get current directory
PROJECT_ROOT=$(pwd)

echo "🚀 Setting up UPSC Portal folder structure in: $PROJECT_ROOT"

# Core React (src)
mkdir -p src/{components,lib,pages,styles,assets}

# React components
mkdir -p src/components/{auth,dashboard,layout}

# Supabase and API
mkdir -p src/lib

# React routing & pages
mkdir -p src/pages/{Login,Dashboard}

# Bootstrap Admin (src-modern)
mkdir -p src-modern/{scripts,styles,images}

# Bootstrap Admin subfolders
mkdir -p src-modern/scripts/{components,utils}
mkdir -p src-modern/styles/{scss,css,pages}

# Add placeholder files to help with git tracking
touch src/components/.gitkeep
touch src/lib/.gitkeep
touch src/pages/.gitkeep
touch src-modern/scripts/.gitkeep
touch src-modern/styles/.gitkeep

# .env file for local environment variables
if [ ! -f ".env" ]; then
  cat <<EOF > .env
# =========================================
# 🔐 Environment Variables (Keep Secret!)
# =========================================

# Google API
VITE_GOOGLE_CLIENT_ID=""

# Supabase
VITE_SUPABASE_URL=""
VITE_SUPABASE_KEY=""

# App Settings
VITE_APP_NAME="UPSC Portal"
EOF
  echo "✅ Created .env template file"
else
  echo "ℹ️  .env file already exists, skipped"
fi

# .gitignore
if [ ! -f ".gitignore" ]; then
  cat <<EOF > .gitignore
# =========================================
# Git Ignore
# =========================================
node_modules
dist
.env
.env.local
.vscode
.DS_Store
*.log
EOF
  echo "✅ Created .gitignore file"
else
  echo "ℹ️  .gitignore file already exists, skipped"
fi

echo "✅ Folder structure created successfully!"
echo "📁 Next steps:"
echo "   1. Place your React login files in src/"
echo "   2. Place Bootstrap Admin template inside src-modern/"
echo "   3. Run 'npm run dev' to test."
echo "🎯 You're ready to start building your UPSC Portal!"

