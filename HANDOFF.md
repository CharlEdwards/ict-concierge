# 🔧 TROUBLESHOOTING: THE SILENCE ERROR

### ✅ STEP 1: Perform the Hardware Test
1. Click the **"VOICE: ON"** button in the top right of the bot.
2. If you hear a **high-pitched electronic "Ping"**, the bot's audio is connected to your speakers.
3. If you do **NOT** hear a ping, your browser/WordPress site is blocking all audio from the chatbot.

### ✅ STEP 2: Divi/WordPress Code Check (MANDATORY)
Browsers block sound in iframes unless you explicitly allow "autoplay". Your Divi Iframe Code **MUST** look like this:
```html
<iframe 
  src="https://PASTE-YOUR-LINK-HERE.vercel.app" 
  style="width:100%; height:800px; border:none;"
  allow="autoplay; microphone">
</iframe>
```
*   **allow="autoplay; microphone"** is what unlocks her voice.

### ✅ STEP 3: Check Chrome/Safari Settings
1. Look at your browser tab. Is there a "Mute" icon?
2. Click the Lock icon next to the URL and ensure **Sound** and **Microphone** are set to "Allow".

**Support:** info@innercitytechnology.com