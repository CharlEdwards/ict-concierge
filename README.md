# ICT Concierge - AI Chatbot

The **ICT Concierge** is an intelligent, AI-powered chatbot designed specifically for **Inner City Technology (ICT)**. Built with React and powered by the Google Gemini API, this concierge helps users discover IT training programs, managed services, and community initiatives while providing a seamless lead collection experience.

![ICT Concierge Screenshot](https://img.shields.io/badge/Status-Site--Ready-emerald)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Gemini%20API%20%7C%20Tailwind-indigo)

## 🚀 Features

- **Gemini 3 Pro Intelligence**: Advanced reasoning and natural conversation powered by the latest Google Gemini models.
- **Search Grounding**: Uses Google Search grounding to provide real-time, accurate information about ICT's services and the tech industry.
- **Lead Collection**: Integrated tool calling to capture user contact information (Name, Phone, Email) and send it directly to your CRM/Webhook.
- **Floating Widget Mode**: Designed to live in the corner of your website as a friendly bubble.
- **Voice Support**: Built-in speech-to-text functionality for hands-free queries.
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop.
- **Dark Mode Support**: Automatically respects system theme preferences.

## 🛠️ Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ict-concierge.git
   cd ict-concierge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Google AI Studio API Key:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🌐 Deployment to Hosting.com

To deploy this to your provider (e.g., https://hosting.com):

1. **Build the production assets:**
   ```bash
   npm run build
   ```
2. **Upload the contents** of the `dist` or `build` folder to your provider's public directory.
3. **Configure the API Key**: In your hosting provider's dashboard, add an environment variable named `API_KEY` with your Gemini key.

## 📦 How to Embed on Your Site

Once your app is deployed at `https://hosting.com`, add this snippet to your main website's HTML:

```html
<!-- ICT Concierge Widget -->
<iframe 
  src="https://hosting.com" 
  style="position:fixed; bottom:20px; right:20px; width:450px; height:750px; border:none; z-index:9999;"
  allow="microphone"
  title="ICT Concierge">
</iframe>
```

## 🏗️ Project Structure

- `App.tsx`: Main application logic and widget toggle.
- `services/geminiService.ts`: Integration with `@google/genai` and function calling logic.
- `constants.ts`: Contains the `ICT_SYSTEM_INSTRUCTION` (the "brain" of the bot).
- `components/`: UI components like `MessageItem` and `InputArea`.
- `types.ts`: TypeScript definitions for messages and roles.

## 📝 Configuration

You can update the bot's behavior by modifying the `ICT_SYSTEM_INSTRUCTION` in `constants.ts`. This allows you to:
- Change the bot's personality.
- Update contact information.
- Add new service details.

## 🤝 Contact

**Inner City Technology**
- Website: [innercitytechnology.com](https://innercitytechnology.com)
- Email: info@innercitytechnology.com
- Phone: 213-810-7325

---
*Built with ❤️ to bridge the digital divide.*
