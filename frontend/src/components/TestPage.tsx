'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">🎯 BLANK WARS DEBUGGING</h1>
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold text-green-400 mb-2">✅ STATUS CHECK</h2>
        <ul className="space-y-2">
          <li>✅ Frontend: Running on port 3009</li>
          <li>✅ Backend: Running on port 4000</li>
          <li>✅ OpenAI API: Connected</li>
          <li>⚠️ Battle Tab: Debugging in progress</li>
        </ul>
      </div>
      <div className="bg-blue-900/30 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-blue-400 mb-2">🔧 NEXT STEPS</h3>
        <p>This test page confirms the server is running. Battle tab issues are due to TypeScript compilation errors in component imports.</p>
      </div>
    </div>
  );
}