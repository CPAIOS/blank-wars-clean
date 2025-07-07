'use client';

import { useState, useEffect } from 'react';
import { kitchenChatService } from '@/services/kitchenChatService';
import { createDemoCharacterCollection } from '@/data/characters';

export default function TestKitchenPage() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check connection status repeatedly
    const checkConnection = async () => {
      console.log('🔄 Checking kitchen chat connection...');
      const isConnected = await kitchenChatService.waitForConnection(10000);
      console.log('🔄 Connection result:', isConnected);
      setConnected(isConnected);
    };
    
    // Check immediately
    checkConnection();
    
    // Also check every 2 seconds for the first 10 seconds
    const interval = setInterval(() => {
      if (!connected) {
        checkConnection();
      }
    }, 2000);
    
    // Clear interval after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [connected]);

  const testKitchenChat = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const characters = createDemoCharacterCollection();
      const dracula = characters.find(c => c.id === 'dracula_01');
      
      if (!dracula) {
        setResponse('Dracula not found!');
        return;
      }

      const context = {
        character: dracula,
        teammates: characters.filter(c => ['sherlock_holmes_01', 'cleopatra_01'].includes(c.id)),
        coachName: 'Coach Thompson',
        livingConditions: {
          apartmentTier: 'spartan_apartment',
          roomTheme: 'gothic',
          sleepsOnCouch: false,
          sleepsOnFloor: false,
          sleepsUnderTable: true,
          roomOvercrowded: true,
          floorSleeperCount: 2,
          roommateCount: 3
        },
        recentEvents: []
      };

      const result = await kitchenChatService.generateKitchenConversation(
        context,
        'Morning coffee time, but Dracula is still sleeping under the kitchen table'
      );
      
      setResponse(result);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Kitchen Chat Test</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <p>Socket Connection: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
          >
            Refresh Page
          </button>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testKitchenChat}
            disabled={loading || !connected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded"
          >
            {loading ? 'Generating...' : 'Test Kitchen Chat'}
          </button>
          
          <button
            onClick={async () => {
              console.log('🔄 Manual connection check...');
              const isConnected = await kitchenChatService.waitForConnection(5000);
              setConnected(isConnected);
            }}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
          >
            Check Connection
          </button>
        </div>
        
        {response && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="font-bold mb-2">Response:</h2>
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}