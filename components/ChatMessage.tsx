import React from 'react';
import type { ChatMessage } from '../types';
import { UserIcon, SparkleIcon, PdfIcon, ImageIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  const Avatar = () => (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500' : 'bg-gray-600'}`}>
      {isModel ? <SparkleIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
    </div>
  );

  return (
    <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <Avatar />
      <div className={`p-4 max-w-lg rounded-2xl ${isModel ? 'bg-gray-800 rounded-br-none' : 'bg-sky-800 rounded-bl-none'}`}>
        {message.file && message.file.type.startsWith('image/') && (
          <div className="mb-2">
            {message.file.previewUrl ? (
              <img src={message.file.previewUrl} alt={message.file.name} className="max-w-xs rounded-lg max-h-64" />
            ) : (
              <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-3 border border-gray-600">
                <ImageIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <span className="text-gray-200 truncate font-medium">{message.file.name}</span>
              </div>
            )}
          </div>
        )}
        {message.file && message.file.type === 'application/pdf' && (
          <div className="mb-2 p-3 bg-gray-700/50 rounded-lg flex items-center gap-3 border border-gray-600">
            <PdfIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
            <span className="text-gray-200 truncate font-medium">{message.file.name}</span>
          </div>
        )}
        <p className="text-white whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessageComponent;