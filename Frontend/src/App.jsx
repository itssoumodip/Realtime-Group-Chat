import { useState, useRef, useEffect } from 'react';
import { Toaster } from 'sonner';
import ModeSelector from './components/ModeSelector';
import NameEntry from './components/NameEntry';
import GroupChatInterface from './components/GroupChatInterface';
import SingleChatInterface from './components/SingleChatInterface';
import Auth from './components/Auth';
import UserList from './components/UserList';
import { connectWS } from './ws';

function App() {
  const [chatMode, setChatMode] = useState(''); // 'group' or 'single'
  const [username, setUsername] = useState('');
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('chatUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedChatUser, setSelectedChatUser] = useState(null);

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

    if (chatMode === 'group' && socket.current) {
      socket.current.emit('joinRoom', { username: trimmed });
    }
  };

  // Mode not selected yet
  if (!chatMode) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <ModeSelector onModeSelect={handleModeSelect} />
      </>
    );
  }

  // Group Chat
  if (chatMode === 'group') {
    if (!username) {
      return (
        <>
          <Toaster position="top-center" richColors />
          <NameEntry onNameSubmit={handleNameSubmit} />
        </>
      );
    }

    return (
      <>
        <Toaster position="top-center" richColors />
        <GroupChatInterface username={username} socket={socket.current} />
      </>
    );
  }

  // Single Chat
  if (chatMode === 'single') {
    // Not logged in
    if (!authUser) {
      return (
        <>
          <Toaster position="top-center" richColors />
          <Auth onLogin={(user) => setAuthUser(user)} />
        </>
      );
    }

    // Logged in, chat partner selected
    if (selectedChatUser) {
      return (
        <>
          <Toaster position="top-center" richColors />
          <SingleChatInterface
            currentUser={authUser}
            otherUser={selectedChatUser}
            socket={socket.current}
            onBack={() => setSelectedChatUser(null)}
          />
        </>
      );
    }

    // Logged in, no partner selected yet
    return (
      <>
        <Toaster position="top-center" richColors />
        <UserList
          currentUser={authUser}
          onSelectUser={setSelectedChatUser}
          onLogout={() => { setAuthUser(null); setChatMode(''); }}
        />
      </>
    );
  }

  return null;
}

export default App;
