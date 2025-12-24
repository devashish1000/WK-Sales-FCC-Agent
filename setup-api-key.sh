#!/bin/bash

echo "🔑 Setting up Gemini API Key for WK Sales FCC AI Agent"
echo ""
echo "To get your API key:"
echo "1. Visit: https://aistudio.google.com/api-keys"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key' or copy an existing key"
echo ""
echo "Enter your API key (or press Enter to skip):"
read -r api_key

if [ -z "$api_key" ]; then
    echo "⚠️  No API key provided. Skipping setup."
    echo ""
    echo "To add it manually, edit .env.local and add:"
    echo "VITE_GEMINI_API_KEY=your_api_key_here"
    exit 0
fi

# Create or update .env.local
if [ -f .env.local ]; then
    # Check if VITE_GEMINI_API_KEY already exists
    if grep -q "VITE_GEMINI_API_KEY" .env.local; then
        # Update existing key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|VITE_GEMINI_API_KEY=.*|VITE_GEMINI_API_KEY=$api_key|" .env.local
        else
            # Linux
            sed -i "s|VITE_GEMINI_API_KEY=.*|VITE_GEMINI_API_KEY=$api_key|" .env.local
        fi
        echo "✅ Updated existing API key in .env.local"
    else
        # Append new key
        echo "" >> .env.local
        echo "VITE_GEMINI_API_KEY=$api_key" >> .env.local
        echo "✅ Added API key to .env.local"
    fi
else
    # Create new file
    echo "VITE_GEMINI_API_KEY=$api_key" > .env.local
    echo "✅ Created .env.local with API key"
fi

echo ""
echo "🎉 Setup complete! Restart your dev server to use the new API key."
echo "   Run: npm run dev"

