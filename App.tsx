import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './components/ChatInput';
import ChatMessageComponent from './components/ChatMessage';
import { SparkleIcon, TrashIcon } from './components/icons';
import { toBase64, processPdf } from './utils/fileUtils';
import { generateResponse } from './services/geminiService';
import type { ChatMessage, FileInfo } from './types';

const CHAT_HISTORY_KEY = 'gemini-study-assistant-chat-history';
const initialMessage: ChatMessage = {
  id: 'init',
  role: 'model',
  text: 'سلام! من دستیار درسی هوش مصنوعی شما هستم. می‌توانید از من سوالات درسی خود را بپرسید، یا عکسی از کتاب، جزوه یا فایل PDF برایم بفرستید تا آن را تحلیل کنم و نکات مهم و تستی را برایتان مشخص کنم.',
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage", error);
    }
    return [initialMessage];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'init')) {
        try {
            // Filter out large data blobs before saving to localStorage to avoid quota errors.
            const messagesToSave = messages.map(msg => {
                if (msg.file) {
                    // We only need metadata (name, type) for history, not the full file data.
                    return { ...msg, file: { ...msg.file, data: '', previewUrl: '' } };
                }
                return msg;
            });
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
        } catch (error) {
            console.error("Failed to save chat history to localStorage", error);
        }
    }
  }, [messages]);

  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

    setIsLoading(true);
    setError(null);
    
    let userMessage: ChatMessage;
    let filesForApi: { mimeType: string; data: string; }[] = [];

    if (file) {
        if (file.type.startsWith('image/')) {
            try {
                const { data, previewUrl } = await toBase64(file);
                filesForApi.push({ mimeType: file.type, data });
                userMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    text,
                    file: { name: file.name, type: file.type, data, previewUrl },
                };
            } catch (err) {
                setError('خطا در پردازش فایل تصویر.');
                setIsLoading(false);
                return;
            }
        } else if (file.type === 'application/pdf') {
            try {
                filesForApi = await processPdf(file);
                 // For PDF, fileInfo in state has no data/preview
                userMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    text,
                    file: { name: file.name, type: file.type, data: '', previewUrl: '' },
                };
            } catch (err: any) {
                setError(`خطا در پردازش فایل PDF: ${err.message}`);
                setIsLoading(false);
                return;
            }
        } else {
            setError('نوع فایل پشتیبانی نمی‌شود. لطفا از عکس یا PDF استفاده کنید.');
            setIsLoading(false);
            return;
        }
    } else {
        userMessage = { id: Date.now().toString(), role: 'user', text };
    }
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const responseText = await generateResponse(text, filesForApi);
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setError('خطا در دریافت پاسخ از هوش مصنوعی: ' + err.message);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید تاریخچه گفتگو را پاک کنید؟')) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([initialMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-[Vazirmatn,sans-serif]" style={{ direction: 'rtl' }}>
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="w-10">
            <button onClick={handleClearChat} className="text-gray-400 hover:text-white" aria-label="Clear chat history">
                <TrashIcon className="w-6 h-6" />
            </button>
        </div>
        <h1 className="text-xl font-bold flex items-center justify-center gap-2 text-center">
          <SparkleIcon className="w-6 h-6 text-cyan-400" />
          <span>دستیار درسی هوش مصنوعی</span>
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start items-center gap-3 my-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500">
                <SparkleIcon className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="p-4 max-w-lg rounded-2xl bg-gray-800">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
           {error && (
             <div className="flex justify-center my-4">
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <p>{error}</p>
                </div>
             </div>
           )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0">
        <div className="max-w-4xl mx-auto">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;