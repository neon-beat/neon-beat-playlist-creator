import { useNavigate } from 'react-router-dom';
import useGoogleApi from '../Hooks/useGoogleApi';
import { useContext, useEffect, useState } from 'react';
import MessageContext from '../Context/MessageContext';
import { Card, Flex, Spin } from 'antd';
import { FaCheck } from 'react-icons/fa6';
import './PlaylistList.css';

const PlaylistList = () => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { isReady, getPlaylists } = useGoogleApi();
  const { messageApi } = useContext<any>(MessageContext);

  const navigate = useNavigate();

  const retrievePlaylists = async () => {
    setLoading(true);
    try {
      const pls: any[] = await getPlaylists();
      setPlaylists(pls);
    } catch {
      messageApi.error('Failed to fetch playlists.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isReady === true) retrievePlaylists();
  }, [isReady]);

  return (
    <Spin spinning={loading === true} wrapperClassName="spin-wrapper h-full">
      <Flex vertical className="w-full h-full p-[1em]">
        <h1 className="text-3xl mb-4 text-center">Your Playlists</h1>
        <Flex gap="middle" wrap className="overflow-auto">
          {playlists.length === 0 && (
            <p>No playlists found.</p>
          )}
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              title={playlist.snippet.title}
              className="min-w-60 max-w-100"
              cover={playlist.snippet.thumbnails?.medium
                ? <img src={playlist.snippet.thumbnails?.medium?.url} style={{ borderRadius: 0 }} alt={playlist.snippet.title} />
                : ''}
              actions={[
                <Flex
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                  justify="center"
                  align="center"
                  style={{ width: '100%', cursor: 'pointer' }}
                  key="view">
                  <FaCheck />
                </Flex>,
              ]}
            >
              <p>by <b>{playlist.snippet.channelTitle}</b></p>
              <p>Published on {new Date(playlist.snippet.publishedAt).toLocaleDateString()}</p>
              <p>{playlist.snippet.description}</p>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Spin>
  );
};

export default PlaylistList;