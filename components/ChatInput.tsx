import React, { useState, useRef } from 'react';
import { SendIcon, PaperclipIcon, CloseIcon, PdfIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null); // No preview for non-image files like PDFs
      }
    }
  };

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text, file || undefined);
      setText('');
      setFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const renderFilePreview = () => {
    if (!file) return null;

    return (
      <div className="relative inline-block mb-2 me-2 bg-gray-700 p-2 rounded-lg">
        {file.type.startsWith('image/') && filePreview ? (
          <img src={filePreview} alt="Preview" className="h-24 w-auto rounded" />
        ) : (
          <div className="flex items-center gap-3 p-2 h-24">
            <PdfIcon className="w-10 h-10 text-red-400" />
            <span className="text-sm text-gray-200 max-w-xs truncate">{file.name}</span>
          </div>
        )}
        <button
          onClick={removeFile}
          className="absolute -top-2 -start-2 bg-gray-600 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
          aria-label="Remove file"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 p-4 border-t border-gray-700">
      {renderFilePreview()}
      <div className="flex items-center bg-gray-700 rounded-full p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="پیام خود را تایپ کنید یا یک فایل آپلود کنید..."
          className="flex-grow bg-transparent text-white placeholder-gray-400 focus:outline-none px-4 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp, application/pdf"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !file)}
          className="p-2 rounded-full bg-cyan-500 text-white disabled:bg-gray-500 transition-colors"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;