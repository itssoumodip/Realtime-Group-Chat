import { useState, useRef, useEffect } from 'react';
import NameEntry from './components/NameEntry';
import ChatInterface from './components/ChatInterface';
import { connectWS } from './ws';

function App() {
  const [username, setUsername] = useState('');
  const socket = useRef(null);

  const
    handleNameSubmit = (name) => {
      // e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;

      socket.current.emit('joinRoom', name);
      setUsername(trimmed);
    };

  useEffect(() => {
    socket.current = connectWS();

    socket.current.on('connect', () => {
      console.log('Connected to server', socket.current.id);

      socket.current.on('roomNotice', (username) => {
        console.log(`${username} joined the group!`);
      }) //popup tostify

      socket.current.on('chatMessage', (msg) => {
        console.log(`${username} joined the group!`);
      })
    })
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
