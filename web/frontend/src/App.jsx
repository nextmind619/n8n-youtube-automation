import { NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Content from './pages/Content';
import Errors from './pages/Errors';
import Settings from './pages/Settings';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: '◉' },
  { to: '/queue', label: 'الطابور', icon: '☰' },
  { to: '/content', label: 'المحتوى', icon: '▶' },
  { to: '/errors', label: 'الأخطاء', icon: '⚠' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙' },
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>
          <div>
            <h1>AutoPilot AI Lab</h1>
            <p>أتمتة يوتيوب</p>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/content" element={<Content />} />
          <Route path="/errors" element={<Errors />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
