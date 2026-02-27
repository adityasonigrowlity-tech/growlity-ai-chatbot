import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, X, Maximize2, Minimize2, RotateCcw, Edit2, Check, XCircle, Volume2, Square, Mic, MicOff, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import chatbotIcon from '../assets/chatbot-icon.png';

const ChatWidget = ({ config }) => {
    // ... existing state ...
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am Growlity Ai Chatbot, your ESG consultant. How can I assist you with your sustainability goals today?', id: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editInput, setEditInput] = useState('');
    const [isPlaying, setIsPlaying] = useState(null); // Track which message ID is playing
    const audioRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const PRESET_QUESTIONS = [
        "What ESG services do you offer?",
        "How can you help with Net-Zero roadmap?",
        "What is BRSR reporting?"
    ];
    const [suggestedQuestions, setSuggestedQuestions] = useState(PRESET_QUESTIONS);

    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            const lastMessage = messages[messages.length - 1];
            // Only auto-scroll to bottom if the last message was from user 
            // or if we just started loading (user just hit send)
            if (lastMessage?.role === 'user' || isLoading) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setInput(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                setInput('');
                recognitionRef.current.start();
                setIsListening(true);
            } else {
                alert('Speech recognition is not supported in this browser.');
            }
        }
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleSpeak = async (text, msgId) => {
        if (isPlaying === msgId) {
            audioRef.current.pause();
            setIsPlaying(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        setIsPlaying(msgId);

        // Remove markdown symbols for better speech
        const cleanText = text.replace(/[*#_~`[\]()]/g, '');
        const baseUrl = config?.apiUrl || '';
        const ttsUrl = `${baseUrl}/api/tts/speak?text=${encodeURIComponent(cleanText)}`;

        const audio = new Audio(ttsUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(null);
        audio.onerror = () => {
            console.error('TTS Playback Error');
            setIsPlaying(null);
        };

        try {
            await audio.play();
        } catch (err) {
            console.error('Audio play failed:', err);
            setIsPlaying(null);
        }
    };

    const handleSend = async (text, isEdit = false) => {
        if (!text.trim()) return;

        if (!isEdit) {
            const userMsg = { role: 'user', content: text, id: Date.now() };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
        }

        setIsLoading(true);
        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const baseUrl = config?.apiUrl || '';
            const response = await axios.post(`${baseUrl}/api/chat`, {
                message: text,
                history: history.slice(-5) // Send last few messages for context
            });

            const aiMsg = { role: 'ai', content: response.data.response, id: Date.now() + 1 };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                content: 'I apologize, but I encountered an error. Please contact Growlity support.',
                id: Date.now() + 1
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (msg) => {
        setEditingId(msg.id);
        setEditInput(msg.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditInput('');
    };

    const saveEdit = () => {
        // 1. Remove the old AI response and the old user message
        const msgIndex = messages.findIndex(m => m.id === editingId);
        const newMessages = messages.slice(0, msgIndex);
        setMessages(newMessages);

        // 2. Clear editing state
        setEditingId(null);

        // 3. Send the new message
        handleSend(editInput);
    };

    const clearChat = () => {
        setMessages([{
            role: 'ai',
            content: 'Conversation cleared. How can I help you again?',
            id: Date.now()
        }]);
        setSuggestedQuestions(PRESET_QUESTIONS);
    };

    const [showScrollButton, setShowScrollButton] = useState(false);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Show button if user has scrolled up more than 100px from the bottom
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    return (
        <div className="grow-chatbot-container">
            {isOpen ? (
                <div className={`grow-chatbot-window ${isExpanded ? 'expanded' : ''}`}>
                    <div className="grow-chatbot-header">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="grow-avatar-small">G</div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Growlity Ai Chatbot</div>
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>ESG Consultant</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <RotateCcw size={18} cursor="pointer" onClick={clearChat} title="New Chat" />
                            {isExpanded ?
                                <Minimize2 size={18} cursor="pointer" onClick={() => setIsExpanded(false)} /> :
                                <Maximize2 size={18} cursor="pointer" onClick={() => setIsExpanded(true)} />
                            }
                            <X size={18} cursor="pointer" onClick={() => setIsOpen(false)} />
                        </div>
                    </div>

                    <div
                        className="grow-chatbot-body"
                        ref={scrollRef}
                        onScroll={handleScroll}
                        style={{ position: 'relative' }}
                    >
                        {messages.map((msg, idx) => (
                            <div key={msg.id} className={`grow-message ${msg.role}`}>
                                {editingId === msg.id ? (
                                    <div className="edit-mode">
                                        <textarea
                                            className="grow-input"
                                            value={editInput}
                                            onChange={(e) => setEditInput(e.target.value)}
                                            style={{ width: '100%', minHeight: '60px', marginBottom: '8px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={saveEdit} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                <Check size={16} /> Save
                                            </button>
                                            <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                                <XCircle size={16} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grow-message-content">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                            {msg.role === 'user' && idx === messages.length - 2 && !isLoading && (
                                                <button
                                                    className="grow-edit-btn"
                                                    onClick={() => startEdit(msg)}
                                                    title="Edit message"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            {msg.role === 'ai' && (
                                                <button
                                                    onClick={() => handleSpeak(msg.content, msg.id)}
                                                    className={`grow-speak-btn ${isPlaying === msg.id ? 'playing' : ''}`}
                                                    title={isPlaying === msg.id ? "Stop listening" : "Listen to response"}
                                                >
                                                    {isPlaying === msg.id ? <Square size={13} fill="currentColor" /> : <Volume2 size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {isLoading && <div className="grow-message ai">Generating ESG guidance...</div>}

                        {showScrollButton && (
                            <button
                                className="grow-scroll-bottom-btn"
                                onClick={scrollToBottom}
                                title="Scroll to bottom"
                            >
                                <ArrowDown size={18} />
                            </button>
                        )}
                    </div>

                    <div className="grow-chatbot-footer">
                        {suggestedQuestions.length > 0 && messages.length <= 2 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            handleSend(q);
                                            setSuggestedQuestions([]);
                                        }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid var(--growlity-green)',
                                            borderRadius: '15px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            color: 'var(--growlity-green)'
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <form className="grow-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(input); setSuggestedQuestions([]); }}>
                            <button
                                type="button"
                                className={`grow-mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleListening}
                                title={isListening ? "Stop Listening" : "Voice Input"}
                                disabled={isLoading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: isListening ? '#ef4444' : '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <input
                                className="grow-input"
                                placeholder={isListening ? "Listening..." : "Type your ESG query..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="grow-send-btn"
                                style={{ width: '40px', height: '40px' }}
                                disabled={isLoading}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <div className="grow-power-tag">Powered by Growlity</div>
                    </div>
                </div>
            ) : (
                <button className="grow-chatbot-trigger" onClick={() => setIsOpen(true)}>
                    <img src={chatbotIcon} alt="Growlity AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                </button>
            )}
        </div>
    );
};

export default ChatWidget;