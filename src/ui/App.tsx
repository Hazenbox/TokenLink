import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('Loading...');

  useEffect(() => {
    // Listen for messages from the plugin code
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg && msg.type === 'plugin-loaded') {
        setMessage(msg.message);
      }
    };
  }, []);

  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '16px',
      fontWeight: 500,
      color: '#333',
    }}>
      {message}
    </div>
  );
};

export default App;
