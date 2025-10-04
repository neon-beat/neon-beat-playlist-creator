import React from 'react';
import { Button, Card, Typography, Space } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import useGoogleApi from '../Hooks/useGoogleApi';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const { isReady, handleSignIn } = useGoogleApi();

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <GoogleOutlined style={{ fontSize: '64px', color: '#4285f4' }} />
            <Title level={2}>Welcome to Neon Beat</Title>
            <Paragraph>
              Please connect your Google account to get started with creating playlists.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<GoogleOutlined />}
              onClick={handleSignIn}
            >
              Connect with Google
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title>Dashboard</Title>
      <Paragraph>You are connected! Start creating your playlists.</Paragraph>
    </div>
  );
};

export default Home;