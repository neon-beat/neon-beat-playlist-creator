import { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useGoogleApi from '../Hooks/useGoogleApi';
import MessageContext from '../Context/MessageContext';
import { Card, Flex, Spin } from 'antd';
import './PlaylistViewer.css';

const PlaylistViewer = () => {
  const { id } = useParams<{ id: string }>();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { isReady, getPlaylistItems } = useGoogleApi();

  const { messageApi } = useContext<any>(MessageContext);

  const retrievePlaylistItems = async (playlistId: string) => {
    setLoading(true);
    try {
      const its: any[] = await getPlaylistItems(playlistId);
      setItems(its);
    } catch {
      messageApi.error('Failed to fetch playlist items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && isReady === true) retrievePlaylistItems(id);
  }, [id, isReady]);

  return (
    <Spin spinning={loading === true} wrapperClassName="spin-wrapper h-full">
      <Flex vertical className="w-full h-full overflow-hidden">
        <h1 className="text-3xl mb-4 text-center">Playlist</h1>
        <Flex vertical gap="middle" className="overflow-auto">
          {items.length === 0 && (
            <p>No items found in this playlist.</p>
          )}
          {items.map((item) => (
            <Card
              key={item.id}
              title={item.snippet.title}
              className="w-full h-50"
            >
              <Flex justify="flex-start" align="center" gap="small">
                {item?.snippet?.thumbnails?.default && (
                  <img
                    src={item.snippet.thumbnails.default.url}
                    alt={item.snippet.title}
                  />
                )}
                <Flex vertical gap="small">
                  <p>by <b>{item.snippet.videoOwnerChannelTitle || 'Unknown'}</b></p>
                  <p>{new Date(item.snippet.publishedAt).toLocaleDateString()}</p>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Spin>
  );
};

export default PlaylistViewer;