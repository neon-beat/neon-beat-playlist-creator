import './App.css'
import { Routes, Route } from 'react-router-dom'
import useGoogleApi from './Hooks/useGoogleApi'
import PlaylistList from './Components/PlaylistList'
import PlaylistViewer from './Components/PlaylistViewer'
import Sidebar from './Components/Sidebar'
import MessageContext from './Context/MessageContext'
import { ConfigProvider, Layout, message, theme } from 'antd'
import Home from './Components/Home'
import AiSetup from './Components/AiSetup'
import { AiProvider } from './Context/AiContext'

function App() {
  useGoogleApi();

  const { Content, Sider } = Layout;
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#9E339F',
          borderRadius: 20,
        },
      }}
    >
      <AiProvider>
        <MessageContext.Provider value={{ messageApi }}>
          <Layout className="npc-layout">
            {contextHolder}
            <Content className="npc-header flex justify-center">
              <img src={`${import.meta.env.BASE_URL}/images/logo.png`} width={300} alt="Logo" className="npc-logo" />
            </Content>
            <Layout className="npc-main">
              <Sider className="npc-sider" width={200}>
                <Sidebar />
              </Sider>
              <Content className="npc-content overflow-auto">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/playlists" element={<PlaylistList />} />
                  <Route path="/playlist/:id" element={<PlaylistViewer />} />
                  <Route path='/ai' element={<AiSetup />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </MessageContext.Provider>
      </AiProvider>
    </ConfigProvider>
  )
}

export default App
