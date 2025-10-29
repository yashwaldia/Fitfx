import React, { useState, useEffect, useRef } from 'react';
import { ChatIcon, CloseIcon, SendIcon, SparklesIcon, UserCircleIcon } from './Icons';
import { startChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import type { Chat } from '@google/genai';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    
    useEffect(() => {
        const newChat = startChat();
        setChat(newChat);
        setHistory([{
            role: 'model',
            parts: "Hi! I'm your AI stylist. How can I help you today?"
        }]);
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);
    
    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: input };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            let text = '';
            
            // Add a placeholder for the model's response
            setHistory(prev => [...prev, { role: 'model', parts: '' }]);

            for await (const chunk of result) {
                text += chunk.text;
                 setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].parts = text;
                    return newHistory;
                });
            }
        } catch (error) {
            console.error(error);
            setHistory(prev => [...prev, { role: 'model', parts: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 rounded-full p-4 shadow-lg hover:scale-110 transition-transform duration-300 z-50"
                aria-label="Open chat"
            >
                {isOpen ? <CloseIcon className="w-8 h-8" /> : <ChatIcon className="w-8 h-8" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col z-40 animate-fade-in-up border border-gray-700">
                    <header className="p-4 border-b border-gray-700 flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-yellow-400">AI Stylist Chat</h3>
                    </header>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-yellow-400"/></div>}
                                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-yellow-500/20 text-yellow-200 rounded-br-none' : 'bg-gray-700/50 text-gray-200 rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.parts}{isLoading && msg.role === 'model' && index === history.length - 1 ? '...' : ''}</p>
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-5 h-5 text-gray-400"/></div>}
                            </div>
                        ))}
                         {isLoading && history[history.length-1].role === 'user' && (
                             <div className="flex items-start gap-3">
                                 <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-yellow-400 animate-pulse"/></div>
                                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-700/50 text-gray-200 rounded-bl-none">
                                    <p className="text-sm text-gray-400 italic">Thinking...</p>
                                </div>
                             </div>
                         )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a question..."
                                disabled={isLoading}
                                className="w-full bg-gray-900 text-gray-200 rounded-full p-3 pr-12 border-2 border-gray-700 focus:border-yellow-400/50 focus:ring-0 outline-none transition-colors duration-300 disabled:opacity-50"
                            />
                            <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-yellow-500 text-gray-900 hover:bg-yellow-400 transition-colors disabled:bg-gray-600">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
