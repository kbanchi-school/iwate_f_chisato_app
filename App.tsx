

import React, { useState, useCallback, useEffect } from 'react';
import type { User, Screen, Video, Notification, Todo, Quiz, UserRole, QuizQuestion, CalendarEvent } from './types';
import { HomeIcon, PuzzleIcon, UsersIcon, CogIcon, BellIcon, CalendarIcon, PlusCircleIcon, CheckCircleIcon, XCircleIcon, HeartIcon, TrophyIcon, ClipboardListIcon } from './components/Icons';
import { generateQuiz } from './services/geminiService';

// Mock Data
const MOCK_USER_TEACHER: User = { id: 'teacher1', name: '田中先生', email: 'teacher@example.com', className: '2年B組', role: 'teacher', points: 0, avatarColor: 'bg-indigo-500', tracksStudyTime: true, birthday: '1985-04-22' };
const MOCK_USER_STUDENT: User = { id: 'student1', name: '鈴木一郎', email: 'student@example.com', className: '2-B', role: 'student', points: 1680, avatarColor: 'bg-teal-500', tracksStudyTime: true, birthday: '2010-08-15' };
const MOCK_VIDEOS: Video[] = [
    { id: 1, title: '中学2年 数学：連立方程式の解き方', uploader: '田中先生', thumbnail: 'https://picsum.photos/seed/math/400/225', src: '', description: '連立方程式の基本的な解き方である代入法と加減法について解説します。', comments: [{id: 1, author: '佐藤健太', text: '分かりやすかったです！', isQuestion: false, replies: []}], likes: 15 },
    { id: 2, title: '中学2年 理科：化学変化と原子・分子', uploader: '田中先生', thumbnail: 'https://picsum.photos/seed/science/400/225', src: '', description: '物質の成り立ちと化学変化について、原子と分子のモデルを使って学びます。', comments: [{id: 1, author: '高橋美咲', text: '鉄と硫黄の実験がよくわかりました。', isQuestion: false, replies: []}, {id: 2, author: '鈴木一郎', text: '分子と原子の違いがまだよく分かりません。', isQuestion: true, replies: [{id: 3, author: '田中先生', text: '良い質問だね！分子はいくつかの原子がくっついた粒子のことだよ。', isQuestion: false, replies: []}]}], likes: 22 },
];
const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 1, message: '田中先生があなたの質問「分子と原子の違い」に回答しました。', read: false, videoId: 2 },
    { id: 2, message: '新しい動画「中学2年 歴史：江戸時代」が投稿されました。', read: true },
];
const MOCK_TODOS: Todo[] = [
    { id: 1, text: '数学ワーク P.34-36', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
    { id: 2, text: '理科レポート提出', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
    { id: 3, text: '英語単語テスト勉強', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
];
const MOCK_QUIZZES: Quiz[] = [
    { id: 1, title: '連立方程式クイックチェック', relatedVideoId: 1, questions: [{ type: 'multiple-choice', question: 'x=y+1, x+y=3 の解は？', options: ['x=2, y=1', 'x=1, y=2', 'x=3, y=0', 'x=0, y=3'], correctAnswer: 'x=2, y=1'}], authorName: '田中先生', className: '2-B' },
    { id: 2, title: '化学変化の基礎', relatedVideoId: 2, questions: [{ type: 'multiple-choice', question: '水の化学式は？', options: ['H2O', 'CO2', 'O2', 'H2'], correctAnswer: 'H2O'}], authorName: '田中先生', className: '2-B' }
];
const MOCK_CLASS_RANKING_DATA = [
    { name: '鈴木一郎', points: 1680 },
    { name: '渡辺翔太', points: 1400 },
    { name: '中村あおい', points: 1100 },
    { name: '山田花子', points: 850 },
    { name: '木村拓也', points: 720 },
    { name: '匿名希望', points: 680 },
    { name: '斎藤美咲', points: 550 },
    { name: '林健一', points: 430 },
    { name: '井上さくら', points: 310 },
    { name: '森大輔', points: 200 },
];

const MOCK_GRADE_RANKING_DATA = [
    { name: '高橋美咲', points: 1850, className: '2-C' },
    { name: '佐藤健太', points: 1720, className: '2-A' },
    { name: '鈴木一郎', points: 1680, className: '2-B' },
    { name: '伊藤さくら', points: 1550, className: '2-A' },
    { name: '田中雄一', points: 1480, className: '2-C' },
    { name: '渡辺翔太', points: 1400, className: '2-B' },
    { name: '匿名希望', points: 1350, className: '2-A' },
    { name: '山本雄大', points: 1210, className: '2-C' },
    { name: '中村あおい', points: 1100, className: '2-B' },
    { name: '小林直樹', points: 980, className: '2-A' },
];


interface AppSettings {
    background: string;
    dndStart: string;
    dndEnd: string;
    volume: number;
}

// Context for global state
interface AppContextType {
    user: User | null;
    setUser: (user: User) => void;
    activeScreen: Screen;
    setActiveScreen: React.Dispatch<React.SetStateAction<Screen>>;
    videos: Video[];
    setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
    todos: Todo[];
    setTodos: (todos: Todo[]) => void;
    quizzes: Quiz[];
    setQuizzes: (quizzes: Quiz[]) => void;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
    setSelectedVideo: React.Dispatch<React.SetStateAction<Video | null>>;
    handleLogout: () => void;
    calendarEvents: CalendarEvent[];
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    setShowAddEventModal: React.Dispatch<React.SetStateAction<boolean>>;
    studyTimeToday: number; // in seconds
    studyLog: { [date: string]: number };
}
const AppContext = React.createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-${weekNo}`;
}

const getSeasonalTheme = () => {
    const month = new Date().getMonth(); // 0-11
    const themes: {[key: number]: {bg: string, stamp: string, title: string}} = {
        0: { bg: 'from-sky-100 to-slate-200', stamp: '❄️', title: '1月のスタンプ' }, // Jan
        1: { bg: 'from-red-100 to-yellow-100', stamp: '👹', title: '2月のスタンプ' }, // Feb
        2: { bg: 'from-pink-100 to-green-100', stamp: '🎎', title: '3月のスタンプ' }, // Mar
        3: { bg: 'from-pink-200 to-pink-100', stamp: '🌸', title: '4月のスタンプ' }, // Apr
        4: { bg: 'from-green-200 to-lime-100', stamp: '🌳', title: '5月のスタンプ' }, // May
        5: { bg: 'from-blue-200 to-indigo-100', stamp: '🐸', title: '6月のスタンプ' }, // Jun
        6: { bg: 'from-cyan-100 to-yellow-100', stamp: '🐚', title: '7月のスタンプ' }, // Jul
        7: { bg: 'from-red-200 to-green-200', stamp: '🍉', title: '8月のスタンプ' }, // Aug
        8: { bg: 'from-indigo-200 to-yellow-100', stamp: '🎑', title: '9月のスタンプ' }, // Sep
        9: { bg: 'from-orange-200 to-red-200', stamp: '🍁', title: '10月のスタンプ' }, // Oct
        10: { bg: 'from-slate-200 to-sky-200', stamp: '🧣', title: '11月のスタンプ' }, // Nov
        11: { bg: 'from-red-200 to-green-200', stamp: '🎄', title: '12月のスタンプ' }, // Dec
    };
    return themes[month] || themes[3];
};


// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
      background: 'bg-slate-100',
      dndStart: '22:00',
      dndEnd: '07:00',
      volume: 80,
  });
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showStampSheet, setShowStampSheet] = useState(false);
  const [loginPointsAwarded, setLoginPointsAwarded] = useState<number | null>(null);
  const [studyTimeToday, setStudyTimeToday] = useState(0); // in seconds
  const [studyLog, setStudyLog] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('study-mate-user');
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
        }
    } catch (e) { console.error("Failed to parse user from localStorage", e); }

    const load = <T,>(key: string, setter: (v: T) => void, def: T) => {
        try { setter(JSON.parse(localStorage.getItem(key)!) || def); }
        catch (e) { setter(def); }
    };
    load('study-mate-quizzes', setQuizzes, MOCK_QUIZZES);
    load('study-mate-todos', setTodos, MOCK_TODOS);
    load('study-mate-calendar', setCalendarEvents, []);
    load('study-mate-settings', setSettings, { background: 'bg-slate-100', dndStart: '22:00', dndEnd: '07:00', volume: 80 });
    
    const storedLog = localStorage.getItem('study-mate-study-log');
    if (storedLog) {
        const parsedLog = JSON.parse(storedLog);
        const todayKey = new Date().toISOString().split('T')[0];
        setStudyLog(parsedLog);
        if (parsedLog[todayKey]) {
            setStudyTimeToday(parsedLog[todayKey]);
        }
    }
    
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
        if (Notification.permission !== "granted") return;
        calendarEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const notificationTime = parseInt(event.notification);
            if (isNaN(notificationTime) || eventDate < new Date()) return;
            const notifyAt = new Date(eventDate.getTime() - notificationTime * 60 * 1000);
            if (new Date() >= notifyAt && new Date() < new Date(notifyAt.getTime() + 60 * 1000)) {
                const notifiedKey = `notified-${event.id}-${event.date}`;
                if (!sessionStorage.getItem(notifiedKey)) {
                    new Notification('予定の通知', { body: `${event.title}が${notificationTime}分後にはじまります。`});
                    sessionStorage.setItem(notifiedKey, 'true');
                }
            }
        });
    }, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [calendarEvents]);

    // Track study time
    useEffect(() => {
        let timerId: number | undefined;
        const studyScreens: Screen[] = ['video', 'quiz'];
        if (user?.tracksStudyTime && studyScreens.includes(activeScreen)) {
            timerId = window.setInterval(() => {
                setStudyTimeToday(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [activeScreen, user?.tracksStudyTime]);

    // Save study time
    useEffect(() => {
        if (user?.tracksStudyTime && user.role === 'student') {
            const todayKey = new Date().toISOString().split('T')[0];
            const newLog = { ...studyLog, [todayKey]: studyTimeToday };
            setStudyLog(newLog);
            localStorage.setItem('study-mate-study-log', JSON.stringify(newLog));
        }
    }, [studyTimeToday]);

    // Award points for study time
    useEffect(() => {
        if (!user || user.role !== 'student') return;
        const STUDY_CHUNK_SECONDS = 1800; // 30 minutes
        const POINTS_PER_CHUNK = 60;

        const lastAwardedChunk = Math.floor((studyTimeToday - 1) / STUDY_CHUNK_SECONDS);
        const currentChunk = Math.floor(studyTimeToday / STUDY_CHUNK_SECONDS);

        if (currentChunk > 0 && currentChunk > lastAwardedChunk) {
            const pointsToAdd = (currentChunk - lastAwardedChunk) * POINTS_PER_CHUNK;
            const updatedUser = { ...user, points: user.points + pointsToAdd };
            updateUser(updatedUser);
            // Optionally, show a notification
            setNotifications(prev => [{id: Date.now(), message: `勉強お疲れ様！ ${pointsToAdd}ポイント獲得しました！`, read: false}, ...prev]);
        }
    }, [studyTimeToday, user]);

  const updateAndStore = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) => 
    (newValue: T | ((prevState: T) => T)) => {
      setter(prev => {
          const valueToStore = typeof newValue === 'function' ? (newValue as (prevState: T) => T)(prev) : newValue;
          localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
      });
    };

  const updateUser = updateAndStore(setUser as React.Dispatch<React.SetStateAction<User | null>>, 'study-mate-user');
  const updateQuizzes = updateAndStore(setQuizzes, 'study-mate-quizzes');
  const updateTodos = updateAndStore(setTodos, 'study-mate-todos');
  const updateSettings = updateAndStore(setSettings, 'study-mate-settings');
  const updateCalendarEvents = updateAndStore(setCalendarEvents, 'study-mate-calendar');

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
      const newEvent = { ...event, id: Date.now() };
      updateCalendarEvents(prev => [...prev, newEvent]);
      setShowAddEventModal(false);
  };

  const handleLogin = (loggedInUser: User) => {
      const today = new Date();
      const todayStr = today.toLocaleDateString();
      const lastLogin = localStorage.getItem('study-mate-last-login');
      let userWithPoints = { ...loggedInUser };

      if (lastLogin !== todayStr) {
          let pointsToAdd = 0;
          if(loggedInUser.role === 'student') {
            const birthday = new Date(loggedInUser.birthday);
            const isBirthday = today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
            pointsToAdd = isBirthday ? 70 : 30;
            userWithPoints.points += pointsToAdd;
          }
          localStorage.setItem('study-mate-last-login', todayStr);
          setLoginPointsAwarded(pointsToAdd);
          setShowStampSheet(true);
          // Reset study time for new day
          setStudyTimeToday(0);
          const todayKey = new Date().toISOString().split('T')[0];
          const newLog = { ...studyLog, [todayKey]: 0 };
          setStudyLog(newLog);
          localStorage.setItem('study-mate-study-log', JSON.stringify(newLog));
      }
      
      updateUser(userWithPoints);
  };

  const handleStampSheetClose = () => {
      setShowStampSheet(false);
      setLoginPointsAwarded(null);
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('study-mate-user');
      localStorage.removeItem('study-mate-last-login');
  };
  
  const handleNavigation = (screen: Screen, video: Video | null = null) => {
      setSelectedVideo(video);
      setActiveScreen(screen);
  };

  const renderScreen = () => {
      if (!user) return <LoginScreen onLogin={handleLogin} />;
      if (activeScreen === 'video' && selectedVideo) return <VideoDetailScreen video={selectedVideo} />;
      
      switch (activeScreen) {
          case 'home': return <HomeScreen />;
          case 'plan': return <PlanScreen />;
          case 'quiz': return <QuizScreen />;
          case 'class': return <ClassScreen onVideoSelect={(video) => handleNavigation('video', video)} />;
          case 'settings': return <SettingsScreen />;
          case 'ranking': return <RankingScreen />;
          default: return <HomeScreen />;
      }
  };
  
  const appContextValue: AppContextType = {
      user, setUser: updateUser as (user: User) => void,
      activeScreen, setActiveScreen: (screen) => handleNavigation(screen),
      videos, setVideos,
      todos, setTodos: updateTodos,
      quizzes, setQuizzes: updateQuizzes,
      notifications, setNotifications,
      settings, setSettings: updateSettings,
      setSelectedVideo: (video) => handleNavigation('video', video),
      handleLogout,
      calendarEvents, addCalendarEvent,
      setShowAddEventModal,
      studyTimeToday,
      studyLog,
  };
  
  const isImageBackground = settings.background.startsWith('data:image');
  const containerBgClass = isImageBackground ? 'bg-white/80 backdrop-blur-sm' : settings.background;

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen font-sans" style={isImageBackground ? {backgroundImage: `url(${settings.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'} : {}}>
          <div className={`container mx-auto max-w-lg md:max-w-4xl h-screen flex flex-col shadow-2xl ${containerBgClass}`}>
              {user && <Header />}
              <main className="flex-1 overflow-y-auto p-4 pb-20">
                  {renderScreen()}
              </main>
              {user && activeScreen !== 'video' && <BottomNav />}
              {user && showAddEventModal && <AddEventModal onClose={() => setShowAddEventModal(false)} onSave={addCalendarEvent} />}
              {user && showStampSheet && <StampSheetModal onClose={handleStampSheetClose} pointsAwarded={loginPointsAwarded} />}
          </div>
      </div>
    </AppContext.Provider>
  );
};

// Screen Components
const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [className, setClassName] = useState('2-B');
  const [tracksStudyTime, setTracksStudyTime] = useState(true);

  const classOptions = ['1-A', '1-B', '1-C', '1-D', '2-A', '2-B', '2-C', '2-D', '3-A', '3-B', '3-C', '3-D'];

  const handleLoginSubmit = () => {
    if (!name.trim()) return alert('名前を入力してください。');
    if (role === 'student' && !birthday) return alert('誕生日を入力してください。');

    const baseUser = role === 'student' ? MOCK_USER_STUDENT : MOCK_USER_TEACHER;
    onLogin({
      ...baseUser,
      name,
      birthday,
      className,
      role,
      tracksStudyTime,
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const minBirthDate = '1900-01-01';
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-sky-100 p-8">
        <h1 className="text-4xl font-bold text-sky-800 mb-2">Study Mate</h1>
        <p className="text-sky-600 mb-8">中学校向け動画共有アプリ</p>
        <div className="w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center text-sky-700 mb-6">ログイン</h2>
            <div className="space-y-4">
                <input type="text" placeholder="名前 (例: 鈴木一郎)" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                {role === 'student' && (
                    <div>
                        <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">誕生日</label>
                        <input id="birthday" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} min={minBirthDate} max={today} className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-500" />
                    </div>
                )}
                <select value={className} onChange={e => setClassName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" disabled={role === 'teacher'}>
                    {classOptions.map(c => <option key={c} value={c}>{c.replace('-', '年') + '組'}</option>)}
                </select>
                <div>
                    <span className="text-gray-700 font-medium">あなたは？</span>
                    <div className="mt-2 flex space-x-6">
                        <label className="inline-flex items-center"><input type="radio" className="form-radio h-5 w-5 text-sky-600" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} /><span className="ml-2 text-gray-800">生徒</span></label>
                        <label className="inline-flex items-center"><input type="radio" className="form-radio h-5 w-5 text-sky-600" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} /><span className="ml-2 text-gray-800">教師</span></label>
                    </div>
                </div>
                <div className="flex items-center pt-2">
                    <input id="trackTime" type="checkbox" checked={tracksStudyTime} onChange={e => setTracksStudyTime(e.target.checked)} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                    <label htmlFor="trackTime" className="ml-2 block text-sm text-gray-900">勉強時間を記録する</label>
                </div>
            </div>
            <button onClick={handleLoginSubmit} className="mt-6 w-full bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition duration-300 font-semibold">
                ログイン
            </button>
        </div>
    </div>
  );
};

const Header: React.FC = () => {
    const { user, notifications, activeScreen, setActiveScreen, videos, setSelectedVideo } = useAppContext();
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (showNotifications) {
            const timer = setTimeout(() => setShowNotifications(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showNotifications]);

    const handleNotificationClick = (notification: Notification) => {
        if (notification.videoId) {
            const video = videos.find(v => v.id === notification.videoId);
            if (video) {
                setSelectedVideo(video);
                setActiveScreen('video');
            }
        }
        setShowNotifications(false);
    };
    
    const isStudent = user?.role === 'student';
    let avatarContent;

    if (isStudent && user?.name) {
        const extractFirstName = (fullName: string): string => {
            const parts = fullName.split(/[\s　]/); // Split by space or full-width space
            if (parts.length > 1) {
                return parts[1];
            }
            // No space: Apply heuristics based on name length
            if (fullName.length === 3) return fullName.substring(1); // e.g., 林健太 -> 健太
            if (fullName.length >= 4) return fullName.substring(2); // e.g., 鈴木一郎 -> 一郎, 井上さくら -> さくら
            return fullName; // Default/fallback for 1 or 2 characters
        };

        const firstName = extractFirstName(user.name);
        
        const fontSizeClass = firstName.length > 2 ? 'text-sm' : 'text-base';
        
        avatarContent = (
            <span className={`font-bold truncate ${fontSizeClass}`}>{firstName}</span>
        );
        
    } else {
        avatarContent = <span className="text-xl">{user?.name?.charAt(0)}</span>;
    }


    return (
        <header className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center">
                {['plan', 'quiz', 'class', 'settings', 'ranking'].includes(activeScreen) && (
                     <button onClick={() => setActiveScreen('home')} className="mr-3 text-slate-600 hover:text-sky-600" aria-label="ホームに戻る">
                         <HomeIcon className="w-7 h-7" />
                     </button>
                )}
                <div className={`w-10 h-10 rounded-full ${user?.avatarColor} flex items-center justify-center text-white font-bold mr-3 overflow-hidden p-1`}>
                    {avatarContent}
                </div>
                <div>
                    <p className="font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-sm text-sky-700">{user?.role === 'student' ? user?.className.replace('-', '年') + '組' : '教師'}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-bold text-sky-600">{user?.points} P</p>
                    <p className="text-xs text-slate-500">保有ポイント</p>
                </div>
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-500 hover:text-sky-600">
                        <BellIcon className="w-7 h-7" />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
                            <div className="p-3 font-semibold text-sm border-b">通知</div>
                            <ul>
                                {notifications.map(n => (
                                    <li key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 text-sm border-b hover:bg-slate-50 ${!n.read ? 'bg-sky-50' : ''} ${n.videoId ? 'cursor-pointer' : ''}`}>
                                        {n.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const BottomNav: React.FC = () => {
    const { activeScreen, setActiveScreen } = useAppContext();
    const navItems = [
        { id: 'plan', label: 'Plan', icon: ClipboardListIcon },
        { id: 'quiz', label: 'クイズ', icon: PuzzleIcon },
        { id: 'home', label: 'Home', icon: HomeIcon },
        { id: 'ranking', label: 'ランク', icon: TrophyIcon },
        { id: 'settings', label: '設定', icon: CogIcon },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg md:max-w-4xl mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 ${activeScreen === item.id ? 'text-sky-600' : 'text-slate-500'}`}
                >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const HomeScreen: React.FC = () => {
    const { todos, setTodos, calendarEvents, setShowAddEventModal } = useAppContext();
    const [newTodo, setNewTodo] = useState('');
    
    const handleAddTodo = () => {
        if (newTodo.trim() === '') return;
        setTodos([{ id: Date.now(), text: newTodo, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), completed: false }, ...todos]);
        setNewTodo('');
    };

    const toggleTodo = (id: number) => setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();
    const visibleTodos = todos.filter(t => !t.completed);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-bold text-sky-800 mb-3">My To Do List</h2>
                <div className="flex space-x-2 mb-4">
                    <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="新しい課題を追加..." className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"/>
                    <button onClick={handleAddTodo} className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold text-sm">追加</button>
                </div>
                <ul className="space-y-2">
                    {visibleTodos.map(todo => (
                        <li key={todo.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                           <div className="flex items-center">
                                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                <span className="ml-3 text-slate-800">{todo.text}</span>
                           </div>
                           <span className={`text-xs font-medium ${isOverdue(todo.dueDate) ? 'text-red-500' : 'text-slate-500'}`}>期限: {new Date(todo.dueDate).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-sky-800 flex items-center"><CalendarIcon className="w-5 h-5 mr-2" />カレンダー</h2>
                    <button onClick={() => setShowAddEventModal(true)} className="bg-sky-500 text-white rounded-full p-2 hover:bg-sky-600 transition" aria-label="予定を追加">
                        <PlusCircleIcon className="w-5 h-5" />
                    </button>
                </div>
                {calendarEvents.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {calendarEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
                            <li key={event.id} className="p-3 bg-sky-50 rounded-lg">
                                <p className="font-semibold text-sky-800">{event.title}</p>
                                <p className="text-sm text-slate-600">{new Date(event.date).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-600 text-center py-4">予定はまだありません。</p>
                )}
            </div>
        </div>
    );
};

const AddEventModal: React.FC<{onClose: () => void, onSave: (event: Omit<CalendarEvent, 'id'>) => void}> = ({onClose, onSave}) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date(new Date().setMinutes(0)).toISOString().slice(0, 16));
    const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
    const [notification, setNotification] = useState<'none' | '5' | '10' | '30'>('10');
    
    const handleSubmit = () => {
        if (!title.trim()) return alert('予定の名前を入力してください。');
        onSave({ title, date, repeat, notification });
    };

    const repeatOptions: { value: 'none' | 'daily' | 'weekly'; label: string }[] = [
        { value: 'none', label: 'なし' }, { value: 'daily', label: '毎日' }, { value: 'weekly', label: '毎週' },
    ];
    const notificationOptions: { value: 'none' | '5' | '10' | '30'; label: string }[] = [
        { value: 'none', label: 'なし' }, { value: '5', label: '5分前' }, { value: '10', label: '10分前' }, { value: '30', label: '30分前' },
    ];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-sky-800 mb-6">新しい予定</h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">予定の名前</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">日時</label>
                        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">繰り返し</label>
                        <div className="flex space-x-2">
                             {repeatOptions.map(option => (
                                <button key={option.value} onClick={() => setRepeat(option.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex-1 ${repeat === option.value ? 'bg-sky-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">通知</label>
                        <div className="grid grid-cols-2 gap-2">
                            {notificationOptions.map(option => (
                                <button key={option.value} onClick={() => setNotification(option.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition text-center ${notification === option.value ? 'bg-sky-500 text-white shadow' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                                    {option.label}
                                </button>
                             ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button onClick={onClose} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition">キャンセル</button>
                    <button onClick={handleSubmit} className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold">保存</button>
                </div>
            </div>
        </div>
    );
};

const WeeklyStudyChart: React.FC<{ log: { [date: string]: number } }> = ({ log }) => {
    const today = new Date();
    const weeklyData: { label: string; time: number }[] = [];
    const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        weeklyData.push({
            label: dayLabels[date.getDay()],
            time: (log[dateKey] || 0) / 60, // Convert seconds to minutes for display
        });
    }

    const maxTime = Math.max(...weeklyData.map(d => d.time), 30); // minimum 30 min axis
    const chartHeight = 150;
    const chartWidth = 300;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };

    const points = weeklyData.map((d, i) => {
        const x = padding.left + i * (chartWidth - padding.left - padding.right) / 6;
        const y = chartHeight - padding.bottom - (d.time / maxTime) * (chartHeight - padding.top - padding.bottom);
        return `${x},${y}`;
    }).join(' ');
    
    const totalWeeklyMinutes = weeklyData.reduce((sum, day) => sum + day.time, 0);
    const totalHours = Math.floor(totalWeeklyMinutes / 60);
    const totalMinutes = Math.round(totalWeeklyMinutes % 60);
    
    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-lg font-bold text-sky-800">一週間の勉強時間</h2>
                <p className="text-sm font-semibold text-slate-600">
                    合計: <span className="text-sky-700 font-bold text-base">{totalHours}</span> 時間 <span className="text-sky-700 font-bold text-base">{totalMinutes}</span> 分
                </p>
            </div>
            <div className="w-full">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Y-axis labels and lines */}
                    <text x={padding.left - 8} y={padding.top} dy="0.3em" textAnchor="end" className="text-xs fill-slate-500">{Math.ceil(maxTime / 10) * 10}分</text>
                    <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} className="stroke-slate-200" strokeWidth="1" />
                    
                    <text x={padding.left - 8} y={chartHeight - padding.bottom} dy="0.3em" textAnchor="end" className="text-xs fill-slate-500">0分</text>
                    <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} className="stroke-slate-300" strokeWidth="1" />
                    
                    {/* Line */}
                    <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={points} />
                    
                    {/* Points */}
                    {weeklyData.map((d, i) => {
                         const x = padding.left + i * (chartWidth - padding.left - padding.right) / 6;
                         const y = chartHeight - padding.bottom - (d.time / maxTime) * (chartHeight - padding.top - padding.bottom);
                         return <circle key={i} cx={x} cy={y} r="3" fill="#0ea5e9" />;
                    })}

                    {/* X-axis labels */}
                    {weeklyData.map((d, i) => {
                         const x = padding.left + i * (chartWidth - padding.left - padding.right) / 6;
                         return (
                            <text key={i} x={x} y={chartHeight - padding.bottom + 15} textAnchor="middle" className="text-xs fill-slate-500 font-semibold">
                                {d.label}
                            </text>
                         );
                    })}
                </svg>
            </div>
        </div>
    );
};

const WeeklyStampSheetDisplay: React.FC = () => {
    const [stampedDays, setStampedDays] = useState<number[]>([]);
    const [theme, setTheme] = useState(getSeasonalTheme());

    useEffect(() => {
        const today = new Date();
        const weekId = getWeekNumber(today);
        const data = JSON.parse(localStorage.getItem('study-mate-stamps') || '{}');
        let currentStamped = [];

        if(data.weekId === weekId) {
            currentStamped = data.stampedDays || [];
        }
        setStampedDays(currentStamped);
        setTheme(getSeasonalTheme()); // update theme if date changes
    }, []);

    const days = ['月', '火', '水', '木', '金', '土', '日'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-bold text-sky-800 mb-3">今週のスタンプシート</h2>
            <div className={`p-4 rounded-lg bg-gradient-to-br ${theme.bg}`}>
                <div className="grid grid-cols-7 gap-2 text-center">
                    {days.map((day) => (
                        <div key={day} className="font-bold text-slate-700 text-sm sm:text-base">
                            {day}
                        </div>
                    ))}
                    {days.map((_, i) => (
                        <div key={i} className="aspect-square bg-white/70 rounded-lg flex items-center justify-center shadow-inner">
                           {stampedDays.includes(i) && <span className="text-2xl sm:text-3xl animate-pop-in" style={{animation: 'pop-in 0.3s ease-out forwards'}}>{theme.stamp}</span>}
                        </div>
                    ))}
                </div>
            </div>
             <style>{`
                @keyframes pop-in { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
            `}</style>
        </div>
    );
};


const PlanScreen: React.FC = () => {
    const { user, studyLog } = useAppContext();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-sky-800">学習プラン</h1>
            {user?.tracksStudyTime && <WeeklyStudyChart log={studyLog} />}
            <WeeklyStampSheetDisplay />
        </div>
    );
};


const ClassScreen: React.FC<{onVideoSelect: (video: Video) => void}> = ({onVideoSelect}) => {
    const { videos, user, setVideos } = useAppContext();
    const isTeacher = user?.role === 'teacher';

    const handleAddVideo = () => {
        const newVideo: Video = {
            id: Date.now(),
            title: `新しい授業動画 ${videos.length + 1}`,
            uploader: user?.name || '不明',
            thumbnail: `https://picsum.photos/seed/${Date.now()}/400/225`,
            src: '',
            description: 'これは新しい授業動画の説明です。',
            comments: [],
            likes: 0
        };
        setVideos([newVideo, ...videos]);
    };
    
    return (
      <div>
        {isTeacher && (
            <div className="mb-4 text-right">
                <button onClick={handleAddVideo} className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold text-sm flex items-center ml-auto">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    動画を投稿する
                </button>
            </div>
        )}
        <VideoList title={`${user?.className.replace('-', '年') + '組'} の動画`} videos={videos} onVideoSelect={onVideoSelect} />
      </div>
    );
};

const VideoList: React.FC<{title: string, videos: Video[], onVideoSelect: (video: Video) => void}> = ({title, videos, onVideoSelect}) => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-sky-800 mb-4">{title}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map(video => (
                    <div key={video.id} onClick={() => onVideoSelect(video)} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover" />
                        <div className="p-4">
                            <h3 className="font-semibold text-slate-800 h-12">{video.title}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-slate-500">{video.uploader}</p>
                                <div className="flex items-center space-x-1 text-red-500">
                                    <HeartIcon className="w-4 h-4" filled />
                                    <span className="text-sm font-medium">{video.likes}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

type UserAnswer = {
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean | null;
}

const QuizScreen: React.FC = () => {
    const { quizzes, setQuizzes, user, setUser } = useAppContext();
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [currentDescriptiveAnswer, setCurrentDescriptiveAnswer] = useState("");
    const [showQuizResults, setShowQuizResults] = useState(false);

    // Create Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creationMode, setCreationMode] = useState<'select' | 'ai' | 'manual'>('select');

    // AI Creation States
    const [aiTopic, setAiTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [numDescriptive, setNumDescriptive] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Manual Creation States
    const [manualQuizTitle, setManualQuizTitle] = useState('');
    const [manualQuestions, setManualQuestions] = useState<QuizQuestion[]>([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType, setNewQuestionType] = useState<'multiple-choice' | 'descriptive'>('multiple-choice');
    const [newQuestionOptions, setNewQuestionOptions] = useState(['', '']);
    const [newQuestionCorrectAnswerIndex, setNewQuestionCorrectAnswerIndex] = useState<number | null>(null);
    const [newDescriptiveAnswer, setNewDescriptiveAnswer] = useState('');


    const startQuiz = (quiz: Quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setShowQuizResults(false);
        setCurrentDescriptiveAnswer("");
    };

    const handleAnswer = (answer: string) => {
        if (!activeQuiz) return;
        const currentQuestion = activeQuiz.questions[currentQuestionIndex];
        let isCorrect: boolean | null = null;
        if (currentQuestion.type === 'multiple-choice') {
            isCorrect = currentQuestion.correctAnswer === answer;
        }
        setUserAnswers([...userAnswers, { question: currentQuestion, userAnswer: answer, isCorrect }]);
        if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setCurrentDescriptiveAnswer("");
        } else {
            setShowQuizResults(true);
        }
    };
    
    const handleGenerateQuiz = async () => {
        if (!aiTopic.trim() || numQuestions <= 0 || numDescriptive > numQuestions) {
            alert('有効なトピック、問題数、記述問題数を入力してください。');
            return;
        }
        setIsGenerating(true);
        const newQuestions = await generateQuiz(aiTopic, numQuestions, numDescriptive);
        if (newQuestions && user) {
            const newQuiz: Quiz = {
                id: Date.now(),
                title: `${aiTopic}に関するAI生成クイズ`,
                questions: newQuestions,
                authorName: user.name,
                className: user.className,
            };
            setQuizzes([newQuiz, ...quizzes]);
            handleCloseCreateModal();
        } else {
            alert('クイズの生成に失敗しました。');
        }
        setIsGenerating(false);
    };

    const handleFinishQuiz = () => {
        const correctCount = userAnswers.filter(a => a.isCorrect).length;
        if (correctCount > 0 && user?.role === 'student' && setUser) {
            const pointsToAdd = correctCount * 30;
            const updatedUser = { ...user, points: user.points + pointsToAdd };
            setUser(updatedUser);
        }
        setActiveQuiz(null);
        setShowQuizResults(false);
    }
    
    // --- Manual Quiz Functions ---
    const resetNewQuestionForm = () => {
        setNewQuestionText('');
        setNewQuestionType('multiple-choice');
        setNewQuestionOptions(['', '']);
        setNewQuestionCorrectAnswerIndex(null);
        setNewDescriptiveAnswer('');
    };

    const handleAddOption = () => {
        setNewQuestionOptions(prev => [...prev, '']);
    };

    const handleDeleteOption = (indexToRemove: number) => {
        if (newQuestionCorrectAnswerIndex === indexToRemove) {
            setNewQuestionCorrectAnswerIndex(null);
        } else if (newQuestionCorrectAnswerIndex !== null && newQuestionCorrectAnswerIndex > indexToRemove) {
            setNewQuestionCorrectAnswerIndex(prev => prev! - 1);
        }
        setNewQuestionOptions(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const handleAddManualQuestion = () => {
        if (!newQuestionText.trim()) { alert('問題文を入力してください。'); return; }
        
        let questionToAdd: QuizQuestion;
        if (newQuestionType === 'multiple-choice') {
            if (newQuestionOptions.some(opt => !opt.trim()) || newQuestionCorrectAnswerIndex === null) {
                alert('すべての選択肢を入力し、正解を選択してください。');
                return;
            }
            questionToAdd = { type: 'multiple-choice', question: newQuestionText, options: newQuestionOptions, correctAnswer: newQuestionOptions[newQuestionCorrectAnswerIndex] };
        } else {
            if (!newDescriptiveAnswer.trim()) { alert('正解を入力してください。'); return; }
            questionToAdd = { type: 'descriptive', question: newQuestionText, options: [], correctAnswer: newDescriptiveAnswer };
        }
        setManualQuestions([...manualQuestions, questionToAdd]);
        resetNewQuestionForm();
    };

    const handleSaveManualQuiz = () => {
        if (!manualQuizTitle.trim()) { alert('クイズのタイトルを入力してください。'); return; }
        if (manualQuestions.length === 0) { alert('少なくとも1問は問題を追加してください。'); return; }

        if (user) {
            const newQuiz: Quiz = { id: Date.now(), title: manualQuizTitle, questions: manualQuestions, authorName: user.name, className: user.className };
            setQuizzes([newQuiz, ...quizzes]);
            handleCloseCreateModal();
        }
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setTimeout(() => { // delay reset to avoid seeing it before modal closes
            setCreationMode('select');
            setAiTopic('');
            setManualQuizTitle('');
            setManualQuestions([]);
            resetNewQuestionForm();
        }, 300);
    };


    if (showQuizResults) {
        const correctCount = userAnswers.filter(a => a.isCorrect).length;
        const pointsEarned = correctCount * 30;
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-sky-800 mb-2 text-center">クイズ結果</h2>
                <p className="text-lg text-center font-semibold text-slate-700 mb-6">{userAnswers.length}問中 {correctCount}問 正解！</p>
                {user?.role === 'student' && pointsEarned > 0 && <p className="text-center font-bold text-amber-500 mb-4">{pointsEarned}ポイント獲得！</p>}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {userAnswers.map((answer, index) => (
                        <div key={index} className="p-3 rounded-lg bg-slate-50 border">
                            <p className="font-semibold text-slate-800 mb-2 flex items-start">
                               {answer.isCorrect === true ? <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0"/> : answer.isCorrect === false ? <XCircleIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5 shrink-0"/> : <div className="w-5 h-5 mr-2 shrink-0"/> }
                               <span>Q{index + 1}. {answer.question.question}</span>
                            </p>
                            <div className="pl-7">
                                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <p className="text-xs font-bold text-blue-800">あなたの回答:</p>
                                    <p className="text-slate-700 text-sm">{answer.userAnswer}</p>
                                </div>
                                {answer.isCorrect !== true && (
                                   <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                                        <p className="text-xs font-bold text-amber-800">正解:</p>
                                        <p className="text-slate-700 text-sm">{answer.question.correctAnswer}</p>
                                   </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => handleFinishQuiz()} className="mt-6 w-full bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition font-semibold">
                    クイズ一覧に戻る
                </button>
            </div>
        );
    }
    
    if (activeQuiz) {
        const question = activeQuiz.questions[currentQuestionIndex];
        return (
            <div className="p-4 bg-white rounded-xl shadow-lg">
                <p className="text-sm text-slate-500 text-right">{currentQuestionIndex + 1} / {activeQuiz.questions.length}</p>
                <h2 className="text-lg font-semibold text-slate-600 mb-2">{activeQuiz.title}</h2>
                <p className="text-xl font-bold text-sky-800 mb-6 min-h-[6rem]">{question.question}</p>
                {question.type === 'multiple-choice' ? (
                     <div className="grid grid-cols-1 gap-3">
                        {question.options.map(option => (
                            <button key={option} onClick={() => handleAnswer(option)} className="w-full bg-sky-100 text-sky-800 py-3 rounded-lg hover:bg-sky-200 transition font-semibold">
                                {option}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <textarea value={currentDescriptiveAnswer} onChange={(e) => setCurrentDescriptiveAnswer(e.target.value)} rows={4} placeholder="ここに回答を入力してください..." className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                        <button onClick={() => handleAnswer(currentDescriptiveAnswer)} className="w-full mt-3 bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition font-semibold">回答する</button>
                    </div>
                )}
            </div>
        );
    }

    const classQuizzes = quizzes.filter(q => q.className === user?.className);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-sky-800">クイズに挑戦</h1>
                <button onClick={() => setShowCreateModal(true)} className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold text-sm flex items-center"><PlusCircleIcon className="w-5 h-5 mr-2" />クイズを作成</button>
            </div>
            <div className="space-y-3">
                {classQuizzes.map(quiz => (
                    <div key={quiz.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-800">{quiz.title}</h3>
                            <p className="text-sm text-slate-500">{quiz.questions.length}問 - 作成者: {quiz.authorName}</p>
                        </div>
                        <button onClick={() => startQuiz(quiz)} className="bg-sky-500 text-white px-5 py-2 rounded-lg hover:bg-sky-600 transition font-semibold">開始</button>
                    </div>
                ))}
            </div>
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                        <h2 className="text-xl font-bold text-sky-800 mb-4 text-center">クイズを作成</h2>
                        <div className="flex-1 overflow-y-auto pr-2">
                        {creationMode === 'select' && (
                            <div className="flex flex-col space-y-4 py-8">
                                <button onClick={() => setCreationMode('ai')} className="w-full bg-sky-100 text-sky-800 py-3 rounded-lg hover:bg-sky-200 transition font-semibold">🤖 AIでかんたん作成</button>
                                <button onClick={() => setCreationMode('manual')} className="w-full bg-slate-100 text-slate-800 py-3 rounded-lg hover:bg-slate-200 transition font-semibold">✍️ 手動で作成</button>
                            </div>
                        )}
                        {creationMode === 'ai' && (
                             <div>
                                 <button onClick={() => setCreationMode('select')} className="text-sm text-sky-600 mb-2">← 選択に戻る</button>
                                 <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                                     <h3 className="font-semibold text-sky-700 mb-2">AIでかんたん作成</h3>
                                     <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="トピックを入力 (例: 平安時代)" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 mb-3"/>
                                     <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div><label className="text-sm font-medium text-slate-700">問題数</label><input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value)))} className="w-full px-3 py-2 border rounded-lg"/></div>
                                        <div><label className="text-sm font-medium text-slate-700">記述問題数</label><input type="number" value={numDescriptive} onChange={e => setNumDescriptive(Math.min(numQuestions, Math.max(0, parseInt(e.target.value))))} className="w-full px-3 py-2 border rounded-lg"/></div>
                                     </div>
                                     <button onClick={handleGenerateQuiz} disabled={isGenerating} className="w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 disabled:bg-slate-400 transition font-semibold">{isGenerating ? '生成中...' : '生成'}</button>
                                 </div>
                             </div>
                        )}
                        {creationMode === 'manual' && (
                            <div>
                                <button onClick={() => setCreationMode('select')} className="text-sm text-sky-600 mb-2">← 選択に戻る</button>
                                <div className="space-y-4">
                                    <input type="text" placeholder="クイズのタイトル" value={manualQuizTitle} onChange={e => setManualQuizTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-semibold"/>
                                    <div className="p-3 bg-slate-100 rounded-lg max-h-24 overflow-y-auto">
                                        <h4 className="font-semibold text-sm text-slate-700 mb-1">追加済みの問題: {manualQuestions.length}問</h4>
                                        <ul className="text-xs list-decimal list-inside text-slate-600">{manualQuestions.map((q, i) => <li key={i} className="truncate">{q.question}</li>)}</ul>
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-slate-800">新しい問題の追加</h4>
                                        <textarea value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} placeholder="問題文" className="w-full p-2 border rounded-lg" rows={2}></textarea>
                                        <div className="flex items-center space-x-4"><span className="text-sm font-medium">形式:</span>
                                            <label><input type="radio" value="multiple-choice" checked={newQuestionType==='multiple-choice'} onChange={() => setNewQuestionType('multiple-choice')} /> 選択</label>
                                            <label><input type="radio" value="descriptive" checked={newQuestionType==='descriptive'} onChange={() => setNewQuestionType('descriptive')} /> 記述</label>
                                        </div>
                                        {newQuestionType === 'multiple-choice' ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-700">選択肢 (正しいものにチェック):</p>
                                                {newQuestionOptions.map((opt, i) => (
                                                    <div key={i} className="flex items-center space-x-2">
                                                        <input type="radio" name="correct-answer" checked={newQuestionCorrectAnswerIndex === i} onChange={() => setNewQuestionCorrectAnswerIndex(i)} />
                                                        <input type="text" placeholder={`選択肢 ${i+1}`} value={opt} onChange={e => { const opts = [...newQuestionOptions]; opts[i] = e.target.value; setNewQuestionOptions(opts); }} className="flex-1 px-2 py-1 border rounded-md text-sm"/>
                                                        <button onClick={() => handleDeleteOption(i)} disabled={newQuestionOptions.length <= 2} className="text-slate-400 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="選択肢を削除">
                                                            <XCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={handleAddOption} className="text-sm text-sky-600 hover:text-sky-800 font-semibold mt-2">+ 選択肢を追加</button>
                                            </div>
                                        ) : (
                                            <div><label className="text-sm font-medium text-slate-700">正解:</label><textarea value={newDescriptiveAnswer} onChange={e => setNewDescriptiveAnswer(e.target.value)} className="w-full p-2 border rounded-lg mt-1" rows={2}></textarea></div>
                                        )}
                                        <button onClick={handleAddManualQuestion} className="w-full bg-sky-500 text-white px-4 py-1.5 rounded-lg hover:bg-sky-600 transition font-semibold text-sm">この問題を追加</button>
                                    </div>
                                    <button onClick={handleSaveManualQuiz} className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">クイズを保存</button>
                                </div>
                            </div>
                        )}
                        </div>
                        <button onClick={handleCloseCreateModal} className="mt-4 w-full bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition">閉じる</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsScreen: React.FC = () => {
    const { settings, setSettings, handleLogout } = useAppContext();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleBgColorChange = (color: string) => setSettings({ ...settings, background: color });
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setSettings({ ...settings, background: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div>
            <h1 className="text-2xl font-bold text-sky-800 mb-6">設定</h1>
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h2 className="font-semibold text-slate-800 mb-3">アプリの背景</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold text-sm">画像を選択</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <button onClick={() => handleBgColorChange('bg-slate-100')} className="w-8 h-8 rounded-full bg-slate-100 border" title="スレート"></button>
                        <button onClick={() => handleBgColorChange('bg-sky-100')} className="w-8 h-8 rounded-full bg-sky-100 border" title="スカイ"></button>
                        <button onClick={() => handleBgColorChange('bg-emerald-100')} className="w-8 h-8 rounded-full bg-emerald-100 border" title="エメラルド"></button>
                        <button onClick={() => handleBgColorChange('bg-amber-100')} className="w-8 h-8 rounded-full bg-amber-100 border" title="アンバー"></button>
                    </div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-md">
                    <h2 className="font-semibold text-slate-800 mb-3">通知設定</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">通知しない時間帯</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <input type="time" value={settings.dndStart} onChange={e => setSettings({...settings, dndStart: e.target.value})} className="px-2 py-1 border rounded-lg" />
                                <span>〜</span>
                                <input type="time" value={settings.dndEnd} onChange={e => setSettings({...settings, dndEnd: e.target.value})} className="px-2 py-1 border rounded-lg" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">通知の音量: {settings.volume}</label>
                            <input type="range" min="0" max="100" value={settings.volume} onChange={e => setSettings({...settings, volume: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md">
                     <h2 className="font-semibold text-slate-800 mb-3">アカウント</h2>
                     <button onClick={handleLogout} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition font-semibold">ログアウト</button>
                </div>
            </div>
        </div>
    );
};

const VideoDetailScreen: React.FC<{ video: Video }> = ({ video }) => {
    const { user, setUser, setActiveScreen, videos, setVideos } = useAppContext();
    const [speed, setSpeed] = useState(1);
    const [comment, setComment] = useState('');
    const [question, setQuestion] = useState('');
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const viewedKey = `viewed-video-${video.id}`;
        if (!sessionStorage.getItem(viewedKey) && user?.role === 'student' && setUser) {
            const updatedUser = { ...user, points: user.points + 50 };
            setUser(updatedUser);
            sessionStorage.setItem(viewedKey, 'true');
        }
    }, [video.id, user, setUser]);

    const handleLike = () => {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        const updatedVideos = videos.map(v => 
            v.id === video.id ? { ...v, likes: v.likes + (newIsLiked ? 1 : -1) } : v
        );
        setVideos(updatedVideos);
    };
    
    const handlePostComment = () => {
        if(!comment.trim()) return;
        setComment('');
    };
    
    const handlePostQuestion = () => {
        if(!question.trim()) return;
        setQuestion('');
    };

    return (
        <div className="pb-6">
            <div className="relative mb-4">
              <button onClick={() => setActiveScreen('home')} className="absolute top-2 left-2 bg-black/40 text-white rounded-full p-1.5 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <video controls className="w-full rounded-lg shadow-lg bg-black" style={{aspectRatio: '16/9'}} poster={video.thumbnail}>
                  Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="px-2">
                <h1 className="text-2xl font-bold text-sky-800">{video.title}</h1>
                <p className="text-sm text-slate-500 mb-2">投稿者: {video.uploader}</p>
                <p className="text-slate-700 mb-4">{video.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <label className="text-sm font-medium">再生速度:</label>
                        <select value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="ml-2 p-1 border rounded">
                            <option value="0.5">0.5x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option>
                        </select>
                    </div>
                    <button onClick={handleLike} className={`flex items-center space-x-2 px-4 py-2 rounded-full transition ${isLiked ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-700'}`}>
                        <HeartIcon className="w-5 h-5" filled={isLiked} />
                        <span>{video.likes}</span>
                    </button>
                </div>
    
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-sky-800 border-b-2 border-sky-200 pb-1 mb-3">質問</h2>
                        <div className="space-y-3 mb-3">
                            {video.comments.filter(c => c.isQuestion).map(c => <CommentItem key={c.id} comment={c}/>)}
                        </div>
                        <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="授業に関する質問を投稿する" rows={3} className="w-full p-2 border rounded-lg text-sm"></textarea>
                        <button onClick={handlePostQuestion} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm mt-2 float-right">質問を投稿</button>
                    </div>
                     <div className="pt-4">
                        <h2 className="text-lg font-semibold text-sky-800 border-b-2 border-sky-200 pb-1 mb-3">コメント</h2>
                         <div className="space-y-3 mb-3">
                            {video.comments.filter(c => !c.isQuestion).map(c => <CommentItem key={c.id} comment={c}/>)}
                        </div>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="コメントを投稿する" rows={3} className="w-full p-2 border rounded-lg text-sm"></textarea>
                        <button onClick={handlePostComment} className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition font-semibold text-sm mt-2 float-right">コメントを投稿</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommentItem: React.FC<{comment: Comment}> = ({comment}) => (
    <div className="bg-slate-100 p-3 rounded-lg text-sm">
        <p className="font-semibold text-slate-800">{comment.author}</p>
        <p className="text-slate-600">{comment.text}</p>
        {comment.replies.map(reply => (
            <div key={reply.id} className="mt-2 ml-4 pl-3 border-l-2 border-sky-200">
                <p className="font-semibold text-sky-700">{reply.author}</p>
                <p className="text-slate-600">{reply.text}</p>
            </div>
        ))}
    </div>
);

const RankingScreen: React.FC = () => {
    const { user } = useAppContext();
    const [rankingScope, setRankingScope] = useState<'class' | 'grade'>('class');

    const title = rankingScope === 'class' ? `${user?.className.replace('-', '年') + '組'} ポイントランキング` : '学年ポイントランキング';

    let processedData;
    if (rankingScope === 'class') {
        processedData = [...MOCK_CLASS_RANKING_DATA];
        const isUserInList = processedData.some(p => p.name === user?.name);
        if (user && user.role === 'student' && !isUserInList) {
            processedData.push({ name: user.name, points: user.points });
        }
    } else {
        processedData = [...MOCK_GRADE_RANKING_DATA];
        const isUserInList = processedData.some(p => p.name === user?.name);
        if (user && user.role === 'student' && !isUserInList) {
            processedData.push({ name: user.name, points: user.points, className: user.className });
        }
    }

    // Sort by points
    processedData.sort((a, b) => b.points - a.points);
    
    return (
        <div>
            <h1 className="text-2xl font-bold text-sky-800 mb-4">{title}</h1>
            
            <div className="mb-4 flex justify-center">
                <div className="relative flex w-full max-w-xs p-1 bg-slate-200 rounded-full">
                    <button
                        onClick={() => setRankingScope('class')}
                        className={`w-1/2 rounded-full py-1.5 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none ${rankingScope === 'class' ? 'bg-white text-sky-600 shadow' : 'text-slate-600'}`}
                    >
                        クラス内
                    </button>
                    <button
                        onClick={() => setRankingScope('grade')}
                        className={`w-1/2 rounded-full py-1.5 text-sm font-semibold transition-colors duration-300 ease-in-out focus:outline-none ${rankingScope === 'grade' ? 'bg-white text-sky-600 shadow' : 'text-slate-600'}`}
                    >
                        学年
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
                <ol className="space-y-3">
                    {processedData.map((player, index) => {
                        const isCurrentUser = player.name === user?.name;
                        const rank = index + 1;
                        const rowClass = isCurrentUser 
                            ? 'bg-sky-100 ring-2 ring-sky-400' 
                            : (rank <= 3 ? 'bg-amber-50' : 'bg-slate-50');
                        
                        return (
                            <li key={`${player.name}-${index}`} className={`flex items-center justify-between p-3 rounded-lg ${rowClass}`}>
                                <div className="flex items-center">
                                    <span className={`font-bold text-lg w-8 text-center ${rank <= 3 ? 'text-amber-500' : 'text-slate-500'}`}>{rank}</span>
                                    <div className="ml-3">
                                      <span className="font-semibold text-slate-800">{isCurrentUser ? '自分' : player.name}</span>
                                      {rankingScope === 'grade' && 'className' in player && (
                                          <span className="ml-2 text-xs text-slate-500">({(player.className as string).replace('-', '年') + '組'})</span>
                                      )}
                                    </div>
                                </div>
                                <span className="font-bold text-sky-600">{player.points} P</span>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
};

const StampSheetModal: React.FC<{onClose: () => void, pointsAwarded?: number | null}> = ({onClose, pointsAwarded}) => {
    const [stampedDays, setStampedDays] = useState<number[]>([]);

    useEffect(() => {
        const today = new Date();
        const weekId = getWeekNumber(today);
        const data = JSON.parse(localStorage.getItem('study-mate-stamps') || '{}');
        let currentStamped = [];

        if(data.weekId === weekId) {
            currentStamped = data.stampedDays || [];
        } else {
            localStorage.removeItem('study-mate-stamps'); // Reset for new week
        }
        
        const dayOfWeek = (today.getDay() + 6) % 7; // Monday is 0, Sunday is 6
        if (!currentStamped.includes(dayOfWeek)) {
            currentStamped.push(dayOfWeek);
        }

        setStampedDays(currentStamped);
        localStorage.setItem('study-mate-stamps', JSON.stringify({ weekId, stampedDays: currentStamped }));
    }, []);

    const theme = getSeasonalTheme();
    const days = ['月', '火', '水', '木', '金', '土', '日'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4" onClick={onClose}>
            <div className={`bg-gradient-to-br ${theme.bg} rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all animate-fade-in-up`} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">{theme.title}</h2>
                {pointsAwarded != null && pointsAwarded > 0 && (
                    <p className="text-center font-bold text-amber-700 text-lg animate-pop-in mt-4 mb-2">
                        ログインボーナス {pointsAwarded}ポイント獲得！
                    </p>
                )}
                <p className="text-center text-slate-600 mb-6">毎日ログインしてスタンプを集めよう！</p>
                <div className="grid grid-cols-7 gap-2 text-center">
                    {days.map((day, i) => <div key={day} className="font-bold text-slate-700">{day}</div>)}
                    {days.map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-white/70 rounded-lg flex items-center justify-center shadow-inner">
                           {stampedDays.includes(i) && <span className="text-3xl animate-pop-in">{theme.stamp}</span>}
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-white/80 text-slate-700 py-2 rounded-lg hover:bg-white transition font-semibold">閉じる</button>
            </div>
             <style>{`
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                @keyframes pop-in { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
                .animate-pop-in { animation: pop-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}

export default App;
