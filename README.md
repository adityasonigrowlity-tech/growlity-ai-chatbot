# Growlity AI Chatbot

A professional ESG (Environmental, Social, and Governance) consultant chatbot built with the MERN stack and LangChain. This chatbot provides expert guidance on sustainability, BRSR reporting, net-zero roadmaps, and carbon advisory.

## 🚀 Recent UI/UX Enhancements
- **ChatGPT-Style Scroll**: Added a "Scroll to Bottom" button that appears when scrolling up.
- **Improved Auto-Scroll**: Intelligent scroll behavior that identifies when to stay at the start of an AI response versus when to follow the user's message.
- **Inline Editing**: The edit pencil icon is now positioned directly at the end of the user's question for a seamless look.
- **External Links**: All links (including the Growlity Solutions link) automatically open in new browser tabs.

## 🛠 Tech Stack

### Backend
- **Core**: Node.js, Express.js
- **Database**: MongoDB (with Atlas Vector Search)
- **AI/LLM Framework**: LangChain
- **Models**: Groq (Llama 3.3 70b), OpenRouter (Fallback)
- **Audio**: ElevenLabs API for Text-to-Speech (TTS)
- **Scraping**: Cheerio & Scrape.do

### Frontend
- **Framework**: React.js (Vite)
- **Icons**: Lucide React
- **Markdown**: React-Markdown with GFM support
- **HTTP Client**: Axios

## 📂 Project Structure

```bash
grow-ai-chatbot/
├── Backend/          # Node.js/Express server & LangChain logic
│   ├── config/      # Database configuration
│   ├── routes/      # API endpoints (chat, tts, ingest)
│   ├── services/    # AI response generation & Vector search
│   └── tests/       # Testing scripts for AI, TTS, and RAG
└── Frontend/         # React/Vite application
    ├── src/
    │   ├── components/ # ChatWidget and other UI parts
    │   └── index.css  # Custom glassmorphism styling
    └── dist/         # Production build (Umd bundle for widget use)
```

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (with Vector Search Index named `AiChatbot`)

### 2. Backend Setup
1. Navigate to the Backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   GOOGLE_GEMINI_API_KEY=your_key
   OPENROUTER_API_KEY=your_key
   GROQ_API_KEY=your_key
   ELEVENLABS_API_KEY=your_key
   CORS_ORIGIN=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the Frontend folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Key Features
- **ESG Specialized**: Pre-trained system prompts to act as a Growlity ESG expert.
- **RAG (Retrieval Augmented Generation)**: Uses MongoDB Vector Search to fetch relevant context from Growlity's knowledge base.
- **Text-to-Speech**: Integrated professional voice responses using ElevenLabs.
- **Glassmorphism UI**: Modern, sleek design that works as a standalone widget.
- **Mobile Responsive**: Fully optimized for small screens with expanded/collapsed modes.

## 📦 Deployment & WordPress Integration

To use the chatbot as a widget on a live site:

1. **Build**: Run `npm run build` in the `Frontend` folder to generate `dist/grow-ai-widget.js`.
2. **Host**: Upload the generated JS & CSS files to your server.
3. **WordPress**: Use a plugin or edit `footer.php` to include the script and initialize it:
   ```html
   <script src="path/to/grow-ai-widget.js"></script>
   <script>
       window.GrowAIChatbot.init({ apiUrl: 'https://your-api.com' });
   </script>
   ```

For a detailed step-by-step guide, see [deployment_guide.md](./deployment_guide.md).

## 🛡 License
© 2026 Growlity. All rights reserved.
