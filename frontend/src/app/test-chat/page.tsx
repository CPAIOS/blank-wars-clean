'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function TestChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('🔌 TEST: Connecting to http://localhost:3006');
    
    socketRef.current = io('http://localhost:3006', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ TEST: Connected to backend!');
      setConnected(true);
      setMessages(prev => [...prev, 'Connected to backend!']);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ TEST: Disconnected from backend');
      setConnected(false);
      setMessages(prev => [...prev, 'Disconnected from backend']);
    });

    socketRef.current.on('chat_response', (data) => {
      console.log('📩 TEST: Received chat response:', data);
      setMessages(prev => [...prev, `${data.character}: ${data.message}`]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendTestMessage = () => {
    if (!socketRef.current || !connected || !inputMessage.trim()) return;

    console.log('📤 TEST: Sending message:', inputMessage);
    setMessages(prev => [...prev, `You: ${inputMessage}`]);

    socketRef.current.emit('chat_message', {
      message: inputMessage,
      character: 'sherlock',
      characterData: {
        name: 'Sherlock Holmes',
        personality: {
          traits: ['Analytical', 'Observant', 'Brilliant'],
          speechStyle: 'Precise and deductive',
          motivations: ['Truth', 'Justice'],
          fears: ['Boredom', 'Ignorance']
        }
      }
    });

    setInputMessage('');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Test Page</h1>
      
      <div className="mb-4">
        <strong>Connection Status:</strong> 
        <span className={connected ? 'text-green-600' : 'text-red-600'}>
          {connected ? ' Connected' : ' Disconnected'}
        </span>
      </div>

      <div className="border p-4 h-64 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">{msg}</div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          placeholder="Type a message to Sherlock Holmes..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={sendTestMessage}
          disabled={!connected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Send
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>This is a direct test of the chat functionality.</p>
        <p>Open browser console (F12) to see connection logs.</p>
      </div>
    </div>
  );
}