import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Send } from 'lucide-react';

const ChatInterface = ({ username, socket }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: username, text: 'Hi', timestamp: '14:53', isOwn: true },
    { id: 2, sender: username, text: 'How are you?', timestamp: '14:53', isOwn: true }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);

  // Demo users and their possible responses
  const demoUsers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const demoResponses = [
    "That's interesting!",
    "I agree with you",
    "Tell me more about that",
    "Really? That's cool!",
    "Nice! 👍",
    "I'm doing great, thanks!",
    "What do you think about this?",
    "Yeah, totally!",
    "Haha, that's funny 😄",
    "Good point!",
    "I see what you mean",
    "Awesome!",
    "Thanks for sharing!",
    "That makes sense",
    "Let's discuss this further"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!socket) return; 

    socket.on('connect', () => {
      console.log('Connected to server', socket.id);

      
    })
  })

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

      setMessages(prevMessages => [...prevMessages, message]);
      setNewMessage('');

      // Simulate responses from other users
      const numberOfResponses = Math.floor(Math.random() * 2) + 1; // 1-2 responses

      for (let i = 0; i < numberOfResponses; i++) {
        const delay = (i + 1) * 1000; // Delay before showing typing indicator
        const typingDuration = 1500 + Math.random() * 1000; // How long typing shows

        setTimeout(() => {
          const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
          setTypingUser(randomUser);
          setIsTyping(true);

          setTimeout(() => {
            const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
            const responseTime = new Date();
            const responseTimestamp = responseTime.getHours().toString().padStart(2, '0') + ':' +
              responseTime.getMinutes().toString().padStart(2, '0');

            const demoMessage = {
              id: Date.now() + i,
              sender: randomUser,
              text: randomResponse,
              timestamp: responseTimestamp,
              isOwn: false
            };

            setMessages(prevMessages => [...prevMessages, demoMessage]);
            setIsTyping(false);
            setTypingUser('');
          }, typingDuration);
        }, delay);
      }
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center">
          <span className="text-white font-semibold text-lg">💬</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-[#303030]">Realtime group chat</div>
          {isTyping && (
            <div className="text-xs text-gray-500">{typingUser} is typing...</div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Signed in as{' '}
          <span className="font-medium text-[#303030] capitalize">{username}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}>
              {!message.isOwn && (
                <Avatar className="w-10 h-10 mt-0.5">
                  <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-medium">
                    {message.sender.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`flex-1 min-w-0 ${message.isOwn ? 'flex justify-end' : ''}`}>
                <div className={`max-w-md ${message.isOwn ? 'text-right' : ''}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${message.isOwn ? 'justify-end' : ''}`}>
                    <span className="text-sm font-semibold text-foreground">
                      {message.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  </div>
                  <div className={`relative inline-block ${message.isOwn
                      ? 'bg-gradient-to-br from-gray-800 to-black text-white rounded-2xl rounded-tr-md'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 text-foreground border border-gray-200/50 rounded-2xl rounded-tl-md'
                    } px-4 py-3 backdrop-blur-sm`}>
                    <p className="text-sm break-words leading-relaxed text-left">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 animate-pulse">
              <Avatar className="w-10 h-10 mt-0.5">
                <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-sm font-medium">
                  {typingUser.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="max-w-md">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {typingUser}
                    </span>
                  </div>
                  <div className="relative inline-block bg-gradient-to-br from-gray-50 to-gray-100 text-foreground border border-gray-200/50 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
