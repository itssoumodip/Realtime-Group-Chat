import { useState, useRef, useEffect } from 'react';
import NameEntry from './components/NameEntry';
import ChatInterface from './components/ChatInterface';
import { connectWS } from './ws';

function App() {
  const [username, setUsername] = useState('');
  const socket = useRef(null);

  const handleNameSubmit = (name) => {
    setUsername(name);
  };

  useEffect(() => {
    socket.current = connectWS();
  }, [])

  return (
    <>
      {!username ? (
        <NameEntry onNameSubmit={handleNameSubmit} />
      ) : (
        <ChatInterface username={username} />
      )}
    </>
  );
}

export default App;
