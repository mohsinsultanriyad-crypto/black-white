
import React, { useState, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';
import { Language } from './translations';
import { db } from './db';
import { Loader2, Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>(MOCK_WORKERS);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Load from backend on Init and set up polling for auto-refresh
  useEffect(() => {
    let isMounted = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    let isFetching = false;

    const fetchData = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        // Replace with your backend API endpoint if needed
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        if (!isMounted) return;
        // Only update state if data differs (shallow compare)
        if (JSON.stringify(data.shifts) !== JSON.stringify(shifts)) setShifts(data.shifts || []);
        if (JSON.stringify(data.leaves) !== JSON.stringify(leaves)) setLeaves(data.leaves || []);
        if (JSON.stringify(data.posts) !== JSON.stringify(posts)) setPosts(data.posts || []);
        if (JSON.stringify(data.workers) !== JSON.stringify(workers)) setWorkers(data.workers || []);
        if (JSON.stringify(data.advanceRequests) !== JSON.stringify(advanceRequests)) setAdvanceRequests(data.advanceRequests || []);
        if (JSON.stringify(data.announcements) !== JSON.stringify(announcements)) setAnnouncements(data.announcements || []);
      } catch (e) {
        console.error("Auto-refresh fetch failed", e);
      } finally {
        isFetching = false;
        if (!isLoaded) setIsLoaded(true);
      }
    };

    // Initial load
    fetchData();

    if (currentUser) {
      const intervalMs = currentUser.role === 'admin' ? 3000 : 5000;
      pollingInterval = setInterval(fetchData, intervalMs);
    }

    return () => {
      isMounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Sync state changes to MongoDB
  // We use custom setters to trigger cloud sync only when data actually changes
  const updateShifts: React.Dispatch<React.SetStateAction<Shift[]>> = (val) => {
    setShifts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      // Identify new/changed shifts and sync them
      setIsSyncing(true);
      db.saveBatch('shifts', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateLeaves: React.Dispatch<React.SetStateAction<Leave[]>> = (val) => {
    setLeaves(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('leaves', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateWorkers: React.Dispatch<React.SetStateAction<User[]>> = (val) => {
    setWorkers(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('workers', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updatePosts: React.Dispatch<React.SetStateAction<SitePost[]>> = (val) => {
    setPosts(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('posts', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>> = (val) => {
    setAdvanceRequests(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('advanceRequests', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const updateAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>> = (val) => {
    setAnnouncements(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      setIsSyncing(true);
      db.saveBatch('announcements', next).finally(() => setIsSyncing(false));
      return next;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Site Data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} workers={workers} />;
  }

  return (
    <div 
      className={`min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden flex flex-col`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Sync Indicator */}
      <div className="fixed top-4 right-4 z-[200] pointer-events-none">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all duration-500 shadow-sm ${isSyncing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
          {isSyncing ? <Cloud className="animate-bounce" size={10} /> : <Cloud size={10} />}
          {isSyncing ? 'Syncing...' : 'Cloud Synced'}
        </div>
      </div>

      {currentUser.role === 'admin' ? (
        <AdminApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={updateShifts} 
          leaves={leaves} 
          setLeaves={updateLeaves}
          workers={workers}
          setWorkers={updateWorkers}
          posts={posts}
          setPosts={updatePosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={updateAdvanceRequests}
          announcements={announcements}
          setAnnouncements={updateAnnouncements}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        <WorkerApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={updateShifts} 
          leaves={leaves} 
          setLeaves={updateLeaves}
          posts={posts}
          setPosts={updatePosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={updateAdvanceRequests}
          announcements={announcements}
          workers={workers}
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  );
};

export default App;
