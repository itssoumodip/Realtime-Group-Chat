import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send } from 'lucide-react';

const ChatInterface = ({ username }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: username, text: 'Hi', timestamp: '14:53', isOwn: true },
    { id: 2, sender: username, text: 'How are you?', timestamp: '14:53', isOwn: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const now = new Date();
      const timestamp = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
      
      const message = {
        id: Date.now(),
        sender: username,
        text: newMessage.trim(),
        timestamp: timestamp,
        isOwn: true
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  return (
    <div className="h-screen bg-secondary/30 flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold">Realtime chat</h1>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {username}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'}`}>
                {!message.isOwn && (
                  <span className="text-xs font-medium mb-1 text-muted-foreground px-1">
                    {message.sender}
                  </span>
                )}
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-lg ${
                    message.isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{message.text}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-1">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background border-t px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
