import './Sidebar.css';
import { Link } from 'react-router-dom';
import { HomeOutlined, UnorderedListOutlined, RobotOutlined } from '@ant-design/icons';

const Sidebar = () => {
  return (
    <div className="npc-sider-content">
      <nav className="npc-sidebar-nav">
        <Link to="/" className="npc-sidebar-link">
          <HomeOutlined style={{ marginRight: '8px' }} />
          Home
        </Link>
        <Link to="/playlists" className="npc-sidebar-link">
          <UnorderedListOutlined style={{ marginRight: '8px' }} />
          Playlists
        </Link>
        <Link to="/ai" className="npc-sidebar-link">
          <RobotOutlined style={{ marginRight: '8px' }} />
          AI Setup
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
