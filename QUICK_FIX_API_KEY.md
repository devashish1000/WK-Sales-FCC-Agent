# 🚀 Quick Fix: Add API Key to Make AI Coach Work

## Current Issue
❌ **API Key is Empty** - The `VITE_GEMINI_API_KEY` exists in Vercel but has no value (just a newline).

## Solution: Add Your API Key

### Step 1: Get Your Full API Key

1. Visit: https://aistudio.google.com/api-keys
2. Sign in with your Google account
3. Click on **any one** of your 4 API keys to reveal the full key
4. Copy the **ENTIRE** key (starts with `AIza...` and is quite long)

**Your Available Keys:**
- `...GyPM` (jarvis, Nov 30, 2025, Free tier)
- `...G-B4` (Jarvis, Nov 30, 2025, Free tier)  
- `...njqA` (Pzifer, Nov 19, 2025, Free tier)
- `...pLPE` (Generative Language API Key, Sep 9, 2025, Free tier)

### Step 2: Add to Vercel

**Option A: Using Helper Script (Easiest)**
```bash
./setup-vercel-api-key.sh
```
Paste your full API key when prompted. The script will:
- Remove the empty variable
- Add your key
- Redeploy automatically

**Option B: Manual CLI**
```bash
# Remove empty variable
vercel env rm VITE_GEMINI_API_KEY production --yes

# Add your key (paste when prompted)
vercel env add VITE_GEMINI_API_KEY production

# Redeploy
vercel --prod --yes
```

**Option C: Via Vercel Dashboard**
1. Go to: https://vercel.com/devashish1000s-projects/wk-sales-fcc-agent/settings/environment-variables
2. Find `VITE_GEMINI_API_KEY`
3. Click "Edit" or remove and re-add
4. Paste your FULL API key
5. Select "Production" environment
6. Save
7. Go to Deployments tab → Click "..." → "Redeploy"

### Step 3: Verify It Works

After redeployment (takes ~30 seconds):

1. Open: https://wk-sales-fcc-agent-g50tzc6lv-devashish1000s-projects.vercel.app
2. Login as Sales Rep
3. Navigate to "AI Coach"
4. Fill out the form (or use defaults)
5. Click "Start Simulation"
6. ✅ Should connect successfully!

## What Happens After Adding Key

The app will automatically:
- ✅ Try **Gemini 3.0** models first (`gemini-3-flash-preview`)
- ✅ Fallback to **Gemini 1.5** if 3.0 fails (`gemini-1.5-flash`) - more robotic voice
- ✅ Work with your **free tier** API keys

## Troubleshooting

**If you still see "Select Paid Key" error:**
- Wait 1-2 minutes after redeployment for changes to propagate
- Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
- Check Vercel logs: `vercel logs`

**If microphone permission is denied:**
- Browser will prompt for microphone access
- Click "Allow" when prompted
- Refresh the page if needed

