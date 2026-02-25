import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import MiniPlayer from '../components/player/MiniPlayer';
import { useAudio } from '../context/AudioContext';
import '../styles/user.css';

const UserLayout = () => {
  const { player } = useAudio();

  return (
    <div className="dash-root">
      <Sidebar />
      <main className="dash-main">
        <Outlet />
      </main>
      {player.src && <MiniPlayer />}
    </div>
  );
};

export default UserLayout;