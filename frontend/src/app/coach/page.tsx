'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, UserProfile, getCoachDisplayName } from '@/contexts/AuthContext';
import { CampaignProgressionManager, CoachingProgress } from '@/systems/campaignProgression';
import { motion } from 'framer-motion';
import { BarChart, LineChart, PieChart } from '@mui/x-charts'; // Placeholder for actual chart library
import Link from 'next/link';

interface CoachStatsProps {
  user: UserProfile;
  playerProgress: CoachingProgress;
}

const CoachStatsDisplay: React.FC<CoachStatsProps> = ({ user, playerProgress }) => {
  const coachTitle = getCoachDisplayName(user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
    >
      <h2 className="text-3xl font-bold text-white mb-4">{coachTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300">
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Username</p>
          <p className="text-xl font-semibold">{user.username}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Coach Level</p>
          <p className="text-xl font-semibold">{user.level}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Total Battles</p>
          <p className="text-xl font-semibold">{user.total_battles}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Total Wins</p>
          <p className="text-xl font-semibold">{user.total_wins}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Rating</p>
          <p className="text-xl font-semibold">{user.rating}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded-md">
          <p className="text-sm text-gray-400">Coaching Actions</p>
          <p className="text-xl font-semibold">{playerProgress.totalCoachingActions}</p>
        </div>
      </div>
    </motion.div>
  );
};

const PsychologyMasteryChart: React.FC<{ masteryLevels: Record<string, number> }> = ({ masteryLevels }) => {
  const data = Object.entries(masteryLevels).map(([key, value]) => ({
    id: key,
    value: value,
    label: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-8"
    >
      <h3 className="text-2xl font-bold text-white mb-4">Psychology Mastery</h3>
      {data.length > 0 ? (
        <PieChart
          series={[{ data, innerRadius: 30, outerRadius: 100, paddingAngle: 5, cornerRadius: 5 }]}
          height={300}
          margin={{ top: 50, bottom: 50, left: 50, right: 50 }}
          slotProps={{
            legend: {
              direction: 'column',
              position: { vertical: 'middle', horizontal: 'right' },
              itemMarkWidth: 10,
              itemMarkHeight: 10,
              labelStyle: {
                fontSize: 12,
                fill: '#E0E0E0', // Light gray for labels
              },
            },
          }}
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fill: '#E0E0E0', // Light gray for axis labels
            },
            '& .MuiChartsAxis-line': {
              stroke: '#E0E0E0', // Light gray for axis lines
            },
            '& .MuiChartsAxis-tick': {
              stroke: '#E0E0E0', // Light gray for axis ticks
            },
          }}
        />
      ) : (
        <p className="text-gray-400">No psychology mastery data available yet. Keep coaching!</p>
      )}
    </motion.div>
  );
};

const CoachProgressionPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [coachingProgress, setCoachingProgress] = useState<CoachingProgress | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      const manager = CampaignProgressionManager.loadProgress();
      setCoachingProgress(manager.getProgress());
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <div className="text-white text-center py-8">Loading coach data...</div>;
  }

  if (!user) {
    return <div className="text-red-400 text-center py-8">Please log in to view your coach profile.</div>;
  }

  if (!coachingProgress) {
    return <div className="text-white text-center py-8">Loading player progress...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/" 
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Game
        </Link>
        
        <div className="flex space-x-4">
          <Link 
            href="/test-chat" 
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Chat with Characters
          </Link>
          <Link 
            href="/test-kitchen" 
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            Kitchen Chat
          </Link>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Coach Profile
      </h1>

      <CoachStatsDisplay user={user} playerProgress={coachingProgress} />

      <PsychologyMasteryChart masteryLevels={coachingProgress.psychologyMasteryLevels} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-8"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Milestones & Achievements</h3>
        {coachingProgress.completedChapters.length > 0 ? (
          <ul className="list-disc list-inside text-gray-300">
            {coachingProgress.completedChapters.map((chapterId) => (
              <li key={chapterId} className="mb-2">
                <span className="font-semibold text-green-400">Chapter Completed:</span> {chapterId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No completed chapters yet. Keep progressing through the campaign!</p>
        )}
        {/* Placeholder for more detailed achievements/skill tree visualization */}
        <p className="text-gray-400 mt-4">
          Future updates will include a detailed skill tree visualization and more specific achievements based on your coaching journey.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-8"
      >
        <h3 className="text-2xl font-bold text-white mb-4">Coaching Performance Over Time</h3>
        {/* Placeholder for charts */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2 bg-gray-700 rounded-md p-4">
            <h4 className="text-lg font-semibold text-white mb-2">Wins vs. Losses</h4>
            {/* Replace with actual data and chart */}
            <BarChart
              series={[
                { data: [user.total_wins], label: 'Wins', color: '#4CAF50' },
                { data: [user.total_battles - user.total_wins], label: 'Losses', color: '#F44336' },
              ]}
              height={200}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: '#E0E0E0',
                },
                '& .MuiChartsAxis-line': {
                  stroke: '#E0E0E0',
                },
                '& .MuiChartsAxis-tick': {
                  stroke: '#E0E0E0',
                },
              }}
            />
          </div>
          <div className="w-full md:w-1/2 bg-gray-700 rounded-md p-4">
            <h4 className="text-lg font-semibold text-white mb-2">Coaching Actions Trend</h4>
            {/* Replace with actual data and chart */}
            <LineChart
              series={[{ data: [0, 5, 10, coachingProgress.totalCoachingActions], label: 'Actions', color: '#2196F3' }]}
              height={200}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: '#E0E0E0',
                },
                '& .MuiChartsAxis-line': {
                  stroke: '#E0E0E0',
                },
                '& .MuiChartsAxis-tick': {
                  stroke: '#E0E0E0',
                },
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CoachProgressionPage;
