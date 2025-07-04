export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold">🎯 SIMPLE TEST PAGE</h1>
      <p className="text-xl mt-4">If you see this, the server is working!</p>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-green-400">✅ Server Status: ONLINE</h2>
        <p>Backend: localhost:3006</p>
        <p>Frontend: localhost:3009</p>
      </div>
    </div>
  );
}