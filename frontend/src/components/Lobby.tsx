
'use client';

import { useState, useEffect } from 'react';
import { Lobby, LobbyMember } from '@/types/lobby';
import { UserProfile } from '@/types/user';
import { useLobby } from '@/hooks/useLobby';
import { Plus, Users, Lock, Globe, Crown, CheckCircle, XCircle, Play, LogOut, UserX, Settings } from 'lucide-react';

interface LobbyProps {
  userProfile: UserProfile;
}

export default function LobbyComponent({ userProfile }: LobbyProps) {
  const [lobbyName, setLobbyName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinLobbyId, setJoinLobbyId] = useState('');
  const [isReady, setIsReady] = useState(false);

  const {
    currentLobby,
    lobbyError,
    publicLobbies,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startBattle,
    updateLobbySettings,
    kickMember,
  } = useLobby({ userProfile });

  const handleCreateLobby = () => {
    createLobby(lobbyName, maxMembers, isPrivate);
  };

  const handleJoinLobby = () => {
    joinLobby(joinLobbyId);
  };

  const handleSetReady = () => {
    setReady(!isReady);
    setIsReady(!isReady);
  };

  const handleStartBattle = () => {
    startBattle();
  };

  const handleKickMember = (memberId: string) => {
    kickMember(memberId);
  };

  useEffect(() => {
    if (currentLobby && currentLobby.hostId !== userProfile.userId) {
      // If not host, reset ready state when joining a new lobby
      setIsReady(false);
    }
  }, [currentLobby, userProfile.userId]);

  const canStartBattle = currentLobby && currentLobby.members.every(m => m.isReady) && currentLobby.members.length >= 2;
  const startBattleMessage = currentLobby ? (
    currentLobby.members.length < 2
      ? 'Need at least 2 members to start'
      : !currentLobby.members.every(m => m.isReady)
        ? 'All members must be ready'
        : 'Start Battle'
  ) : '';

  // Placeholder for avatar
  const getAvatar = (displayName: string) => {
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">PVP Lobby System</h1>

      {lobbyError && (
        <div className="bg-red-600/20 border border-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">Error: {lobbyError}</span>
        </div>
      )}

      {!currentLobby ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Create Lobby Section */}
          <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 flex items-center gap-3">
              <Plus className="w-7 h-7" /> Create New Lobby
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="lobbyName" className="block text-gray-300 text-sm font-medium mb-2">Lobby Name</label>
                <input
                  type="text"
                  id="lobbyName"
                  placeholder="My Awesome Lobby"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="maxMembers" className="block text-gray-300 text-sm font-medium mb-2">Max Members</label>
                <input
                  type="number"
                  id="maxMembers"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  min="2"
                  max="8"
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mr-3 w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300 text-lg">Private Lobby</span>
              </label>
              <button onClick={handleCreateLobby} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                Create Lobby
              </button>
            </div>
          </div>

          {/* Join Lobby Section */}
          <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 flex items-center gap-3">
              <Users className="w-7 h-7" /> Join Existing Lobby
            </h2>
            <div className="space-y-5 mb-8">
              <div>
                <label htmlFor="joinLobbyId" className="block text-gray-300 text-sm font-medium mb-2">Lobby ID</label>
                <input
                  type="text"
                  id="joinLobbyId"
                  placeholder="Enter Lobby ID"
                  value={joinLobbyId}
                  onChange={(e) => setJoinLobbyId(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button onClick={handleJoinLobby} className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white p-3 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                Join Lobby by ID
              </button>
            </div>

            <h3 className="text-2xl font-semibold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-3">
              <Globe className="w-6 h-6" /> Public Lobbies ({publicLobbies.length})
            </h3>
            {publicLobbies.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No public lobbies available. Be the first to create one!</p>
            ) : (
              <ul className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {publicLobbies.map((lobby) => (
                  <li key={lobby.id} className="bg-gray-700/70 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center border border-gray-600 transition-all duration-200 hover:scale-[1.02]">
                    <div className="text-center sm:text-left mb-3 sm:mb-0">
                      <p className="font-semibold text-xl text-white">{lobby.name}</p>
                      <p className="text-sm text-gray-300">Host: {lobby.hostId}</p>
                      <p className="text-sm text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                        <Users className="w-4 h-4" /> {lobby.members.length}/{lobby.maxMembers} members
                        {lobby.isPrivate ? (
                          <span title="Private Lobby">
                            <Lock className="w-4 h-4 ml-2 text-gray-400" />
                          </span>
                        ) : (
                          <span title="Public Lobby">
                            <Globe className="w-4 h-4 ml-2 text-blue-400" />
                          </span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => joinLobby(lobby.id)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105">
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Current Lobby View */
        <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Lobby: {currentLobby.name}</h2>
          <p className="text-gray-400 text-lg mb-8 text-center">Host: {currentLobby.hostId === userProfile.userId ? 'You' : currentLobby.hostId}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Lobby Members */}
            <div>
              <h3 className="text-2xl font-semibold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 flex items-center gap-3">
                <Users className="w-6 h-6" /> Members ({currentLobby.members.length}/{currentLobby.maxMembers})
              </h3>
              <ul className="space-y-4">
                {currentLobby.members.map((member) => (
                  <li key={member.profile.userId} className="bg-gray-700/70 p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold text-white">
                        {getAvatar(member.profile.displayName)}
                      </div>
                      <div>
                        <p className="font-semibold text-xl text-white flex items-center gap-2">
                          {member.profile.displayName}
                          {currentLobby.hostId === member.profile.userId && (
                            <span title="Lobby Host">
                              <Crown className="w-5 h-5 text-yellow-400" />
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">Level: {member.profile.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`w-4 h-4 rounded-full ${member.isReady ? 'bg-green-500' : 'bg-yellow-500'}`} title={member.isReady ? 'Ready' : 'Not Ready'}></span>
                      {currentLobby.hostId === userProfile.userId && member.profile.userId !== userProfile.userId && (
                        <button onClick={() => handleKickMember(member.profile.userId)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full text-sm transition-colors shadow-md" title="Kick Member">
                          <UserX className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lobby Actions & Settings */}
            <div className="space-y-6">
              {currentLobby.hostId === userProfile.userId ? (
                <> {/* Host Actions */}
                  <h3 className="text-2xl font-semibold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-3">
                    <Settings className="w-6 h-6" /> Host Controls
                  </h3>
                  <button
                    onClick={handleStartBattle}
                    disabled={!canStartBattle}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                    title={startBattleMessage}
                  >
                    <Play className="inline-block mr-2 w-6 h-6" /> Start Battle
                  </button>
                  <button onClick={leaveLobby} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white p-4 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                    <LogOut className="inline-block mr-2 w-6 h-6" /> Close Lobby
                  </button>

                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <h4 className="text-xl font-semibold mb-4 text-gray-300">Lobby Settings</h4>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentLobby.isPrivate}
                        onChange={(e) => updateLobbySettings({ isPrivate: e.target.checked })}
                        className="mr-3 w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-300 text-lg">Private Lobby</span>
                    </label>
                    {/* Add max members change etc. */}
                  </div>
                </>
              ) : (
                <> {/* Member Actions */}
                  <h3 className="text-2xl font-semibold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" /> Your Actions
                  </h3>
                  <button onClick={handleSetReady} className={`w-full p-4 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105 ${isReady ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900' : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'}`}>
                    {isReady ? 'Unready' : 'Ready Up'}
                  </button>
                  <button onClick={leaveLobby} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white p-4 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                    <LogOut className="inline-block mr-2 w-6 h-6" /> Leave Lobby
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
