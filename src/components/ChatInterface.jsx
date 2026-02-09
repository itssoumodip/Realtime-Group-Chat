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
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-6 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-base font-semibold text-foreground">Realtime chat</h1>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-foreground font-medium">{username}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}>
              {!message.isOwn && (
                <Avatar className="w-10 h-10 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {message.sender.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex-1 min-w-0 ${message.isOwn ? 'flex justify-end' : ''}`}>
                <div className={`max-w-md ${message.isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {message.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  </div>
                  <div className={`mt-0.5 px-4 py-2 rounded-lg inline-block ${
                    message.isOwn 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/70 text-foreground'
                  }`}>
                    <p className="text-sm break-words leading-relaxed text-left">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background border-t px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 h-10 bg-secondary/50 border-0 focus-visible:ring-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              size="icon"
              className="h-10 w-10"
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
