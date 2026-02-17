import { useState, useRef, useEffect } from 'react';
import { Toaster } from 'sonner';
import ModeSelector from './components/ModeSelector';
import NameEntry from './components/NameEntry';
import GroupChatInterface from './components/GroupChatInterface';
import SingleChatInterface from './components/SingleChatInterface';
import { connectWS } from './ws';

function App() {
  const [chatMode, setChatMode] = useState(''); // 'group' or 'single'
  const [username, setUsername] = useState('');
  const socket = useRef(null);

  // Initialize socket connection once
  useEffect(() => {
    socket.current = connectWS();

    socket.current.on('connect', () => {
      console.log('Connected to server', socket.current.id);
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const handleModeSelect = (mode) => {
    setChatMode(mode);
  };

  const handleNameSubmit = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setUsername(trimmed);

    // Join room for group chat
    if (chatMode === 'group' && socket.current) {
      socket.current.emit('joinRoom', { username: trimmed });
    }
  };

  // Render based on current state
  if (!chatMode) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ModeSelector onModeSelect={handleModeSelect} />
      </>
    );
  }

  if (!username) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <NameEntry onNameSubmit={handleNameSubmit} />
      </>
    );
  }

  // Render appropriate chat interface
  if (chatMode === 'group') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <GroupChatInterface username={username} socket={socket.current} />
      </>
    );
  }

  if (chatMode === 'single') {
    return <SingleChatInterface username={username} socket={socket.current} />;
  }

  return null;
}

export default App;
