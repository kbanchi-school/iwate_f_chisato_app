import React, { useState, useCallback, useEffect } from 'react';
import type { User, Screen, Video, Notification, Todo, Quiz, UserRole, QuizQuestion, CalendarEvent } from './types';
import { HomeIcon, StarIcon, PuzzleIcon, UsersIcon, CogIcon, BellIcon, CalendarIcon, PlusCircleIcon, CheckCircleIcon, XCircleIcon } from './components/Icons';
import { generateQuiz } from './services/geminiService';

// Mock Data
const MOCK_USER_TEACHER: User = { id: 'teacher1', name: '田中先生', email: 'teacher@example.com', className: '2年B組', role: 'teacher', points: 1200, avatarColor: 'bg-indigo-500', tracksStudyTime: true };
const MOCK_USER_STUDENT: User = { id: 'student1', name: '鈴木一郎', email: 'student@example.com', className: '2年B組', role: 'student', points: 350, avatarColor: 'bg-teal-500', tracksStudyTime: true };
const MOCK_VIDEOS: Video[] = [
    { id: 1, title: '中学2年 数学：連立方程式の解き方', uploader: '田中先生', thumbnail: 'https://picsum.photos/seed/math/400/225', src: '', description: '連立方程式の基本的な解き方である代入法と加減法について解説します。', comments: [{id: 1, author: '佐藤健太', text: '分かりやすかったです！', isQuestion: false, replies: []}]},
    { id: 2, title: '中学2年 理科：化学変化と原子・分子', uploader: '田中先生', thumbnail: 'https://picsum.photos/seed/science/400/225', src: '', description: '物質の成り立ちと化学変化について、原子と分子のモデルを使って学びます。', comments: [{id: 1, author: '高橋美咲', text: '鉄と硫黄の実験がよくわかりました。', isQuestion: false, replies: []}, {id: 2, author: '鈴木一郎', text: '分子と原子の違いがまだよく分かりません。', isQuestion: true, replies: [{id: 3, author: '田中先生', text: '良い質問だね！分子はいくつかの原子がくっついた粒子のことだよ。', isQuestion: false, replies: []}]}]},
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
    { id: 1, title: '連立方程式クイックチェック', relatedVideoId: 1, questions: [{ type: 'multiple-choice', question: 'x=y+1, x+y=3 の解は？', options: ['x=2, y=1', 'x=1, y=2', 'x=3, y=0', 'x=0, y=3'], correctAnswer: 'x=2, y=1'}], authorName: '田中先生', className: '2年B組' },
    { id: 2, title: '化学変化の基礎', relatedVideoId: 2, questions: [{ type: 'multiple-choice', question: '水の化学式は？', options: ['H2O', 'CO2', 'O2', 'H2'], correctAnswer: 'H2O'}], authorName: '田中先生', className: '2年B組' }
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
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
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
}
const AppContext = React.createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
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

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('study-mate-user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const today = new Date().toLocaleDateString();
            const lastLogin = localStorage.getItem('study-mate-last-login');
            if (lastLogin !== today) {
                parsedUser.points += 200;
                localStorage.setItem('study-mate-last-login', today);
            }
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

  const updateAndStore = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) => 
    (newValue: T) => {
      setter(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    };

  const updateQuizzes = updateAndStore(setQuizzes, 'study-mate-quizzes');
  const updateTodos = updateAndStore(setTodos, 'study-mate-todos');
  const updateSettings = updateAndStore(setSettings, 'study-mate-settings');
  const updateCalendarEvents = updateAndStore(setCalendarEvents, 'study-mate-calendar');

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
      const newEvent = { ...event, id: Date.now() };
      updateCalendarEvents([...calendarEvents, newEvent]);
      setShowAddEventModal(false);
  };

  const handleLogin = (loggedInUser: User) => {
      const today = new Date().toLocaleDateString();
      const lastLogin = localStorage.getItem('study-mate-last-login');
      let userWithPoints = { ...loggedInUser };
      if (lastLogin !== today) {
        userWithPoints.points += 200;
        localStorage.setItem('study-mate-last-login', today);
      }
      setUser(userWithPoints);
      localStorage.setItem('study-mate-user', JSON.stringify(userWithPoints));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('study-mate-user');
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
          case 'recommended': return <RecommendedScreen onVideoSelect={(video) => handleNavigation('video', video)} />;
          case 'quiz': return <QuizScreen />;
          case 'class': return <ClassScreen onVideoSelect={(video) => handleNavigation('video', video)} />;
          case 'settings': return <SettingsScreen />;
          default: return <HomeScreen />;
      }
  };
  
  const appContextValue: AppContextType = {
      user, setUser,
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
  };
  
  const isImageBackground = settings.background.startsWith('data:image');
  const containerBgClass = isImageBackground ? 'bg-white/80 backdrop-blur-sm' : settings.background;

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen font-sans" style={isImageBackground ? {backgroundImage: `url(${settings.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'} : {}}>
          <div className={`container mx-auto max-w-lg h-screen flex flex-col shadow-2xl ${containerBgClass}`}>
              {user && <Header />}
              <main className="flex-1 overflow-y-auto p-4 pb-20">
                  {renderScreen()}
              </main>
              {user && activeScreen !== 'video' && <BottomNav />}
              {user && showAddEventModal && <AddEventModal onClose={() => setShowAddEventModal(false)} onSave={addCalendarEvent} />}
          </div>
      </div>
    </AppContext.Provider>
  );
};

// Screen Components
const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('2年B組');
  const [tracksStudyTime, setTracksStudyTime] = useState(true);

  const handleLoginSubmit = () => {
    const baseUser = role === 'student' ? MOCK_USER_STUDENT : MOCK_USER_TEACHER;
    onLogin({
      ...baseUser,
      name: name || baseUser.name,
      className: className,
      role: role,
      tracksStudyTime: tracksStudyTime,
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-sky-100 p-8">
        <h1 className="text-4xl font-bold text-sky-800 mb-2">Study Mate</h1>
        <p className="text-sky-600 mb-8">中学校向け動画共有アプリ</p>
        <div className="w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center text-sky-700 mb-6">ログイン</h2>
            <div className="space-y-4">
                <input type="text" placeholder="名前 (例: 鈴木一郎)" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <input type="text" placeholder="クラス名 (例: 2年B組)" value={className} onChange={e => setClassName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
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

    return (
        <header className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center">
                {['recommended', 'quiz', 'class', 'settings'].includes(activeScreen) && (
                     <button onClick={() => setActiveScreen('home')} className="mr-3 text-slate-600 hover:text-sky-600" aria-label="ホームに戻る">
                         <HomeIcon className="w-7 h-7" />
                     </button>
                )}
                <div className={`w-10 h-10 rounded-full ${user?.avatarColor} flex items-center justify-center text-white font-bold mr-3`}>
                    {user?.name.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-sm text-sky-700">{user?.className}</p>
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
        { id: 'recommended', label: '新着', icon: StarIcon },
        { id: 'quiz', label: 'クイズ', icon: PuzzleIcon },
        { id: 'home', label: 'Home', icon: HomeIcon },
        { id: 'class', label: 'クラス', icon: UsersIcon },
        { id: 'settings', label: '設定', icon: CogIcon },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around">
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

const RecommendedScreen: React.FC<{onVideoSelect: (video: Video) => void}> = ({onVideoSelect}) => {
    const { videos } = useAppContext();
    return <VideoList title="おすすめ・新着動画" videos={videos} onVideoSelect={onVideoSelect} />;
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
            comments: []
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
        <VideoList title={`${user?.className} の動画`} videos={videos} onVideoSelect={onVideoSelect} />
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
                            <h3 className="font-semibold text-slate-800">{video.title}</h3>
                            <p className="text-sm text-slate-500">{video.uploader}</p>
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

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [numDescriptive, setNumDescriptive] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

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
            if (isCorrect && user && setUser) {
                setUser({ ...user, points: user.points + 20 });
            }
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
            setShowCreateModal(false);
            setAiTopic('');
        } else {
            alert('クイズの生成に失敗しました。');
        }
        setIsGenerating(false);
    };

    if (showQuizResults) {
        const correctCount = userAnswers.filter(a => a.isCorrect).length;
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-sky-800 mb-2 text-center">クイズ結果</h2>
                <p className="text-lg text-center font-semibold text-slate-700 mb-6">{userAnswers.length}問中 {correctCount}問 正解！</p>
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
                <button onClick={() => { setActiveQuiz(null); setShowQuizResults(false); }} className="mt-6 w-full bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition font-semibold">
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
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-sky-800 mb-4">クイズを作成</h2>
                        <div className="mb-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
                             <h3 className="font-semibold text-sky-700 mb-2">AIでかんたん作成</h3>
                             <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="トピックを入力 (例: 平安時代)" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 mb-3"/>
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">問題数</label>
                                    <input type="number" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value)))} className="w-full px-3 py-2 border rounded-lg"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">記述問題数</label>
                                    <input type="number" value={numDescriptive} onChange={e => setNumDescriptive(Math.min(numQuestions, Math.max(0, parseInt(e.target.value))))} className="w-full px-3 py-2 border rounded-lg"/>
                                </div>
                             </div>
                             <button onClick={handleGenerateQuiz} disabled={isGenerating} className="w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 disabled:bg-slate-400 transition font-semibold">{isGenerating ? '生成中...' : '生成'}</button>
                        </div>
                        <p className="text-center text-slate-500 my-2">または</p>
                        <div className="text-slate-600 text-center"><p>手動でのクイズ作成（未実装）</p></div>
                        <button onClick={() => setShowCreateModal(false)} className="mt-4 w-full bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition">閉じる</button>
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
    const { user, setUser, setActiveScreen } = useAppContext();
    const [speed, setSpeed] = useState(1);
    const [comment, setComment] = useState('');
    const [question, setQuestion] = useState('');

    const handlePostComment = () => {
        if(!user || !setUser) return;
        if(user.points < 500) { alert('ポイントが足りません。(500P必要)'); return; }
        if(!comment.trim()) return;
        setUser({...user, points: user.points - 500});
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
                
                <div className="mb-4">
                    <label className="text-sm font-medium">再生速度:</label>
                    <select value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="ml-2 p-1 border rounded">
                        <option value="0.5">0.5x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option>
                    </select>
                </div>
    
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-sky-800 border-b-2 border-sky-200 pb-1 mb-3">質問</h2>
                        <div className="space-y-3 mb-3">
                            {video.comments.filter(c => c.isQuestion).map(c => <CommentItem key={c.id} comment={c}/>)}
                        </div>
                        <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="授業に関する質問を投稿する (ポイント消費なし)" rows={3} className="w-full p-2 border rounded-lg text-sm"></textarea>
                        <button onClick={handlePostQuestion} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm mt-2 float-right">質問を投稿</button>
                    </div>
                     <div className="pt-4">
                        <h2 className="text-lg font-semibold text-sky-800 border-b-2 border-sky-200 pb-1 mb-3">コメント</h2>
                         <div className="space-y-3 mb-3">
                            {video.comments.filter(c => !c.isQuestion).map(c => <CommentItem key={c.id} comment={c}/>)}
                        </div>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="コメントを投稿する (500P消費)" rows={3} className="w-full p-2 border rounded-lg text-sm"></textarea>
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

export default App;
