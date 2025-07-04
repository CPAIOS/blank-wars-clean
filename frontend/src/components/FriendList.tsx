
'use client';

import { useState, useEffect } from 'react';
import { UserProfile, Friendship } from '@/types/user';
import { UserService } from '@/services/userService';
import { User, Users, Search, UserPlus, Check, X, Clock, UserCheck, UserMinus } from 'lucide-react';

interface FriendListProps {
  currentUserProfile: UserProfile;
}

export default function FriendList({ currentUserProfile }: FriendListProps) {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [newFriendSearchTerm, setNewFriendSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const userService = new UserService();

  const fetchFriendsData = async () => {
    const fetchedFriends = await userService.getFriends();
    setFriends(fetchedFriends);
    const fetchedPendingRequests = await userService.getPendingFriendRequests();
    setPendingRequests(fetchedPendingRequests);
  };

  useEffect(() => {
    fetchFriendsData();
  }, [currentUserProfile]);

  const handleSearchUsers = async () => {
    if (newFriendSearchTerm.trim()) {
      const results = await userService.searchUsers(newFriendSearchTerm);
      setSearchResults(results.filter(user => user.userId !== currentUserProfile.userId));
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    const friendship = await userService.addFriend(targetUserId);
    if (friendship) {
      console.log('Friend request sent:', friendship);
      fetchFriendsData(); // Refresh lists
      setNewFriendSearchTerm('');
      setSearchResults([]);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    await userService.acceptFriendRequest(friendshipId);
    fetchFriendsData(); // Refresh lists
  };

  const handleRejectRequest = async (friendshipId: string) => {
    await userService.rejectFriendRequest(friendshipId);
    fetchFriendsData(); // Refresh lists
  };

  // Placeholder for avatar
  const getAvatar = (displayName: string) => {
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Friend List</h1>

      {/* My Friends */}
      <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700 mb-8">
        <h2 className="text-3xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 flex items-center gap-3">
          <Users className="w-7 h-7" /> My Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <UserMinus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No friends yet. Send a request to connect!</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {friends.map((friend) => (
              <li key={friend.userId} className="bg-gray-700/70 p-4 rounded-lg shadow-md flex items-center justify-between border border-gray-600 transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold text-white">
                    {getAvatar(friend.displayName)}
                  </div>
                  <div>
                    <p className="font-semibold text-xl text-white">{friend.displayName}</p>
                    <p className="text-sm text-gray-400">Level: {friend.level} | XP: {friend.xp}</p>
                  </div>
                </div>
                {/* Add more friend actions here, e.g., view profile, message, remove friend */}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending Requests */}
      <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700 mb-8">
        <h2 className="text-3xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-3">
          <Clock className="w-7 h-7" /> Pending Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No pending friend requests.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pendingRequests.map((request) => (
              <li key={request.id} className="bg-gray-700/70 p-4 rounded-lg shadow-md flex items-center justify-between border border-gray-600 transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-xl font-bold text-white">
                    {getAvatar(request.userId1)}
                  </div>
                  <div>
                    <p className="font-semibold text-xl text-white">Request from {request.userId1}</p>
                    <p className="text-sm text-gray-400">Status: {request.status}</p>
                  </div>
                </div>
                <div className="space-x-3">
                  <button onClick={() => handleAcceptRequest(request.id)} className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-md flex items-center gap-2">
                    <Check className="w-5 h-5" /> Accept
                  </button>
                  <button onClick={() => handleRejectRequest(request.id)} className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-md flex items-center gap-2">
                    <X className="w-5 h-5" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Friend Section */}
      <div className="bg-gray-800/50 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-3">
          <UserPlus className="w-7 h-7" /> Add New Friend
        </h2>
        <div className="flex mb-6">
          <input
            type="text"
            placeholder="Search by User ID or Display Name"
            value={newFriendSearchTerm}
            onChange={(e) => setNewFriendSearchTerm(e.target.value)}
            className="flex-grow p-3 rounded-l-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSearchUsers} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-r-lg font-semibold transition-colors shadow-md flex items-center gap-2">
            <Search className="w-5 h-5" /> Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="bg-gray-700/70 p-4 rounded-lg max-h-60 overflow-y-auto shadow-inner border border-gray-600">
            <h3 className="text-xl font-semibold mb-4 text-gray-300">Search Results</h3>
            <ul className="space-y-3">
              {searchResults.map((user) => (
                <li key={user.userId} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-lg font-bold text-white">
                      {getAvatar(user.displayName)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-white">{user.displayName}</p>
                      <p className="text-sm text-gray-400">ID: {user.userId} | Level: {user.level}</p>
                    </div>
                  </div>
                  <button onClick={() => handleAddFriend(user.userId)} className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md flex items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Add Friend
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
