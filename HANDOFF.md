# 🔧 CRITICAL: VERCEL KEY CONFIGURATION

If the bot says **"API KEY NOT DETECTED"** in the chat, follow this exactly:

1.  Open your **Vercel Project Settings**.
2.  Go to **Environment Variables**.
3.  Find `API_KEY`. 
4.  **RENAME IT** to `VITE_API_KEY`.
5.  **RE-DEPLOY** the project.

**Why?** 
Modern web security (Vite) blocks the browser from seeing secret keys unless they have the `VITE_` prefix. Without this, the chat input will not respond.

### ✅ Quick Status Check
- **Beep but no Chat**: Key is missing or incorrectly named in Vercel.
- **No Beep and no Chat**: Browser is blocking Audio/Iframe (See Step 2).

**Support:** info@innercitytechnology.com