import React, { useState, useEffect } from 'react'
import ChatWidget from './components/ChatWidget'
import './index.css'


function App() {
    const [config, setConfig] = useState({
        apiUrl: 'http://localhost:5000' // Default local dev URL
    })

    useEffect(() => {
        // Look for global config from window.GrowAIChatbot.init()
        if (window.GrowAIChatbotConfig) {
            setConfig(prev => ({ ...prev, ...window.GrowAIChatbotConfig }));
        }
    }, [])

    return (
        <ChatWidget config={config} />
    )
}

export default App
