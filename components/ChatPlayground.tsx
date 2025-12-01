import React, { useState, useRef, useEffect } from 'react';
import { AIConfig, ChatMessage, BotStatus } from '../types';
import { generateBotResponse } from '../services/geminiService';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, Check, CheckCheck } from 'lucide-react';

interface ChatPlaygroundProps {
  config: AIConfig;
  status: BotStatus;
  addLog: (msg: string, type: 'info' | 'error' | 'success') => void;
  incrementMessageCount: () => void;
}

const ChatPlayground: React.FC<ChatPlaygroundProps> = ({ config, status, addLog, incrementMessageCount }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'bot', content: 'Olá! Como posso ajudar você hoje?', timestamp: new Date(), status: 'read' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!config.isActive) {
      addLog("IA está desativada nas configurações. O bot não responderá.", "warning");
      return;
    }

    if (status !== BotStatus.CONNECTED) {
       addLog("Bot desconectado. Conecte no painel 'Conexão' primeiro para testar.", "error");
       // Allow sending just to see UI, but mock a "network error" or similar? 
       // Actually, for playground, let's allow it but warn.
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);
    incrementMessageCount();

    // Change status to delivered then read rapidly for effect
    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? {...m, status: 'read'} : m));
    }, 1000);

    try {
      const responseText = await generateBotResponse(messages, newMessage.content, config);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: responseText,
        timestamp: new Date(),
        status: 'read'
      };

      setMessages(prev => [...prev, botMessage]);
      addLog('IA gerou resposta com sucesso.', 'success');
    } catch (error) {
      addLog('Falha ao gerar resposta da IA.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen pt-4 pb-4 px-4 flex flex-col max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
             <BotIcon />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Bot de Teste (Você)</h3>
            <p className="text-xs text-green-600 font-medium">Online</p>
          </div>
        </div>
        <div className="flex text-slate-400 gap-4">
          <Video size={20} />
          <Phone size={20} />
          <div className="w-[1px] h-5 bg-slate-200"></div>
          <MoreVertical size={20} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#e5ddd5] relative overflow-hidden flex flex-col shadow-inner">
        {/* Background Pattern Mock */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 z-0 scrollbar-hide">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] md:max-w-[60%] rounded-lg p-3 relative shadow-sm text-sm md:text-base ${
                  msg.role === 'user' 
                    ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' 
                    : 'bg-white text-slate-900 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[10px] text-slate-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'user' && (
                        <span className="text-blue-500">
                           {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />} 
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex w-full justify-start">
                <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] p-3 rounded-b-2xl shadow-sm border border-t-0 border-slate-200 flex items-center gap-4 z-10">
        <button className="text-slate-500 hover:text-slate-700">
            <Smile size={24} />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
            <Paperclip size={24} />
        </button>
        <input 
            type="text" 
            className="flex-1 p-3 rounded-lg border-none focus:ring-0 text-slate-800 bg-white placeholder-slate-400"
            placeholder="Digite uma mensagem"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
        />
        <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
            <Send size={20} />
        </button>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center mt-2 text-xs text-slate-400">
         Ambiente de simulação. As mensagens são processadas pela Gemini API em tempo real.
      </div>
    </div>
  );
};

// Helper icon
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
)

export default ChatPlayground;