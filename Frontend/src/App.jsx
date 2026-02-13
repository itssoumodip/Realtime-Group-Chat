import { useState } from 'react';
import NameEntry from './components/NameEntry';
import ChatInterface from './components/ChatInterface';

function App() {
  const [username, setUsername] = useState('');

  const handleNameSubmit = (name) => {
    setUsername(name);
  };

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
