import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="npc-sider-content">
      <nav className="npc-sidebar-nav">
        <a href={`${import.meta.env.BASE_URL}/`} className="npc-sidebar-link">Home</a>
        <a href={`${import.meta.env.BASE_URL}/playlists`} className="npc-sidebar-link">Playlists</a>
      </nav>
    </div>
  );
};

export default Sidebar;
