// Blank Wars - Frontend Page Templates
// These are the main pages needed for your Next.js app

// =====================================================
// app/page.tsx - Landing Page
// =====================================================
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-purple-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Blank Wars
            </h1>
            <p className="text-2xl text-purple-200 mb-8">
              Battle. Bond. Become Legendary.
            </p>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              The first card battle game where you can actually talk to your warriors. 
              Form real bonds between rounds and watch them grow stronger!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all"
              >
                Play Free Now
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 border-2 border-purple-400 text-purple-400 font-bold rounded-full hover:bg-purple-400 hover:text-white transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
        
        {/* Floating character avatars */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl animate-float">⚔️</div>
          <div className="absolute top-40 right-20 text-6xl animate-float-delayed">🧙</div>
          <div className="absolute bottom-20 left-1/4 text-6xl animate-float">🐵</div>
          <div className="absolute bottom-40 right-1/3 text-6xl animate-float-delayed">👑</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-black/30">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-2xl font-bold text-white mb-2">Battle</h3>
              <p className="text-gray-300">
                Strategic turn-based combat with characters from all of history and mythology
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-white mb-2">Chat & Bond</h3>
              <p className="text-gray-300">
                Talk to your characters between rounds. They remember and grow closer to you!
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-2">Collect & Compete</h3>
              <p className="text-gray-300">
                Build your collection, enter tournaments, and become a legend!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// =====================================================
// app/login/page.tsx - Login Page
// =====================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Store tokens
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);

      // Redirect to game
      router.push('/game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Welcome Back, Warrior!
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="warrior@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Enter Battle'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              New to Blank Wars?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// app/register/page.tsx - Registration Page
// =====================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      // Store tokens
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);

      // Redirect to game
      router.push('/game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Join the Battle!
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="warrior@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="WarriorName"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Start Your Journey'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300">
                Login here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>You'll receive 3 starter characters to begin your adventure!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// app/game/page.tsx - Main Game Dashboard
// =====================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GameDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch user data
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Unauthorized');
      }

      const userData = await userResponse.json();
      setUser(userData);

      // Fetch user's characters
      const charsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/characters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const charsData = await charsResponse.json();
      setCharacters(charsData.characters);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Blank Wars</h1>
          <div className="flex items-center gap-6">
            <span className="text-white">Welcome, {user?.username}!</span>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/');
              }}
              className="text-purple-400 hover:text-purple-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/battle/matchmaking')}
            className="bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-lg text-white hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-2">⚔️</div>
            <h3 className="text-xl font-bold">Find Battle</h3>
            <p className="text-sm opacity-90">Match with another player</p>
          </button>

          <button
            onClick={() => router.push('/shop')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg text-white hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-xl font-bold">Shop</h3>
            <p className="text-sm opacity-90">Buy packs and gems</p>
          </button>

          <button
            onClick={() => router.push('/collection')}
            className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-lg text-white hover:shadow-xl transition-all"
          >
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-xl font-bold">Collection</h3>
            <p className="text-sm opacity-90">View your characters</p>
          </button>
        </div>

        {/* Your Characters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Your Warriors</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-all cursor-pointer"
                onClick={() => router.push(`/character/${character.id}`)}
              >
                <div className="text-4xl text-center mb-2">{character.avatar_emoji}</div>
                <h3 className="text-white font-bold text-center">{character.name}</h3>
                <p className="text-gray-400 text-sm text-center">Level {character.level}</p>
                <div className="mt-2 text-center">
                  <span className="text-pink-400 text-sm">Bond: {'❤️'.repeat(Math.min(character.bond_level, 5))}</span>
                </div>
              </div>
            ))}
          </div>
          
          {characters.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No characters yet! Open some packs to get started.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// =====================================================
// Additional utility components and styles
// =====================================================

// Add to your global CSS (app/globals.css)
const animationStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 3s ease-in-out infinite;
  animation-delay: 1.5s;
}
`;