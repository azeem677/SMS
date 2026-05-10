import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minus, MessageSquare, Lightbulb, HelpCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AIBot = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: t('Hello! I am your Project Assistant. How can I help you today?') }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simple bot logic for demo
        setTimeout(() => {
            let response = "";
            const lowerInput = input.toLowerCase();

            if (lowerInput.includes('idea') || lowerInput.includes('suggest')) {
                response = t("I suggest organizing your projects by priority. You can use the 'Analytics' tab to see which projects need more attention!");
            } else if (lowerInput.includes('how') || lowerInput.includes('use')) {
                response = t("You can start by creating a new Workspace, then add projects and tasks. Don't forget to invite your team members in the 'Team' section!");
            } else if (lowerInput.includes('task')) {
                response = t("Tasks are the heart of your project. You can assign them to team members and set deadlines in the Task Details page.");
            } else {
                response = t("That's interesting! Is there anything specific about project management you'd like to know more about?");
            }

            setMessages(prev => [...prev, { role: 'bot', content: response }]);
        }, 600);
    };

    const quickActions = [
        { icon: <Lightbulb size={14} />, text: t("Project Ideas"), action: () => setInput(t("Give me some project ideas")) },
        { icon: <HelpCircle size={14} />, text: t("How to use"), action: () => setInput(t("How do I use this system?")) },
        { icon: <Sparkles size={14} />, text: t("Optimization"), action: () => setInput(t("How to optimize my workflow?")) },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 active:scale-95"
                >
                    <Bot size={28} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="flex flex-col w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold tracking-tight">Project Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] opacity-80 uppercase font-bold tracking-widest">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <Minus size={18} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {msg.role === 'bot' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-2xl text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-tl-none shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 py-2 flex flex-wrap gap-2 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800">
                        {quickActions.map((item, idx) => (
                            <button 
                                key={idx} 
                                onClick={item.action}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm"
                            >
                                {item.icon}
                                {item.text}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={t("Ask me anything...")}
                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm px-2 dark:text-white"
                            />
                            <button 
                                onClick={handleSend}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIBot;
