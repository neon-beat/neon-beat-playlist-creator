import './Sidebar.css';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="npc-sider-content">
      <nav className="npc-sidebar-nav">
        <Link to="/" className="npc-sidebar-link">Home</Link>
        <Link to="/playlists" className="npc-sidebar-link">Playlists</Link>
      </nav>
    </div>
  );
};

export default Sidebar;
