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
        <Card style={{ maxWidth: 500, textAlign: 'center', top: '56px', left: '27px', transform: 'rotate(47deg)' }}>
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
      <Title>Welcome to Neon Beat Playlist Creator</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={3}>About This Tool</Title>
          <Paragraph>
            Neon Beat Playlist Creator is a powerful tool designed to help you manage and enhance your YouTube playlists with AI-powered metadata enrichment.
          </Paragraph>
          <Title level={4}>Features:</Title>
          <ul style={{ lineHeight: '1.8' }}>
            <li>📋 <strong>Import YouTube Playlists:</strong> Connect with your Google account to access and manage your YouTube playlists</li>
            <li>✏️ <strong>Edit Metadata:</strong> Easily edit track information including title, artist, year, and custom fields with inline editing</li>
            <li>➕ <strong>Add Custom Fields:</strong> Create your own metadata fields to track additional information like genre, mood, tempo, or any other details</li>
            <li>🤖 <strong>AI Enhancement:</strong> Use AI to automatically enrich your tracks with additional metadata such as genre, mood, album information, and more</li>
            <li>🎨 <strong>Multiple AI Providers:</strong> Choose from various AI endpoints including OpenAI, Google Gemini, Together AI, OpenRouter, and more</li>
            <li>💾 <strong>Local Storage:</strong> All your edits and AI configurations are stored locally in your browser for privacy and convenience</li>
          </ul>
        </Card>
        <Card>
          <Title level={4}>Getting Started:</Title>
          <Paragraph>
            1. Navigate to <strong>Playlists</strong> to view and select your YouTube playlists<br />
            2. Click on a playlist to start editing track information<br />
            3. Set up your AI provider in <strong>AI Setup</strong> to enable automatic metadata enrichment<br />
            4. Use the AI button on any track to get additional information automatically
          </Paragraph>
        </Card>
      </Space>
    </div>
  );
};

export default Home;