import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import styles from './index.css?inline'

window.GrowAIChatbot = {
    init: (config = {}) => {
        window.GrowAIChatbotConfig = config;

        // Create host element
        const host = document.createElement('div');
        host.id = 'grow-ai-chatbot-root';
        document.body.appendChild(host);

        // Create Shadow DOM — external CSS (WordPress/Astra) CANNOT cross this boundary
        const shadow = host.attachShadow({ mode: 'open' });

        // Inject Google Fonts into the main document (fonts work across shadow boundary)
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            document.head.appendChild(fontLink);
        }

        // Inject widget CSS inside the shadow root (fully isolated from host page)
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        shadow.appendChild(styleEl);

        // Create React mount point inside shadow root
        const container = document.createElement('div');
        container.id = 'grow-ai-chatbot-app';
        shadow.appendChild(container);

        // Render React app inside the shadow DOM
        ReactDOM.createRoot(container).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
};

// Auto-init if script is loaded with no manual call in dev
if (import.meta.env.DEV) {
    window.GrowAIChatbot.init();
}
