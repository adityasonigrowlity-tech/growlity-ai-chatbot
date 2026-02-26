import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

window.GrowAIChatbot = {
    init: (config = {}) => {
        window.GrowAIChatbotConfig = config;
        const container = document.createElement('div');
        container.id = 'grow-ai-chatbot-root';
        document.body.appendChild(container);

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
