import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useGoogleApi from '../Hooks/useGoogleApi';
import MessageContext from '../Context/MessageContext';
import { useAi } from '../Context/AiContext';
import { Button, Card, Checkbox, DatePicker, Flex, Input, Modal, Popconfirm, Spin } from 'antd';
import { CheckOutlined, ClockCircleOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, RobotOutlined, StarFilled, StarOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import './PlaylistViewer.css';
import VideoPreview from './VideoPreview';

const PlaylistViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [playlistTitle, setPlaylistTitle] = useState<string>('Playlist');
  const [isEditingPlaylistTitle, setIsEditingPlaylistTitle] = useState<boolean>(false);
  const [editedPlaylistTitle, setEditedPlaylistTitle] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<{ itemId: string; fieldKey: string } | null>(null);
  const [editedValue, setEditedValue] = useState<string | Dayjs | null>(null);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState<boolean>(false);
  const [addingFieldItemId, setAddingFieldItemId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  const [newFieldIsBonus, setNewFieldIsBonus] = useState<boolean>(false);
  const [aiLoadingItemId, setAiLoadingItemId] = useState<string | null>(null);

  // Batch AI processing state
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [batchCancelRequested, setBatchCancelRequested] = useState<boolean>(false);

  // Field selection modal state
  const [isFieldSelectionModalOpen, setIsFieldSelectionModalOpen] = useState<boolean>(false);
  const [pendingFields, setPendingFields] = useState<any>({});
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([]);

  // Video preview modal state
  const [isVideoPreviewModalOpen, setIsVideoPreviewModalOpen] = useState<boolean>(false);
  const [selectedVideoItemId, setSelectedVideoItemId] = useState<string | null>(null);

  // Import functionality
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isReady, getPlaylistItems } = useGoogleApi();
  const { apiKey, baseURL, model } = useAi();

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

  const labelToCamelCase = (label: string): string => {
    return label
      .trim()
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  };

  const detectFieldType = (fieldKey: string, fieldLabel: string): 'text' | 'year' => {
    // Convert to lowercase for case-insensitive matching
    const keyLower = fieldKey.toLowerCase();
    const labelLower = fieldLabel.toLowerCase();

    // Check if the key or label contains "year"
    if (keyLower.includes('year') || labelLower.includes('year')) {
      return 'year';
    }

    // Add more type detection logic here in the future
    // For example:
    // if (keyLower.includes('date')) return 'date';
    // if (keyLower.includes('url') || keyLower.includes('link')) return 'url';

    // Default to text
    return 'text';
  };

  const handleAddField = () => {
    if (!addingFieldItemId || !newFieldLabel.trim() || !newFieldValue.trim()) {
      messageApi.warning('Please enter both label and value.');
      return;
    }

    const fieldKey = labelToCamelCase(newFieldLabel);

    setItems(items.map(item => {
      if (item.id === addingFieldItemId) {
        return {
          ...item,
          fields: {
            ...item.fields,
            [fieldKey]: {
              type: 'text',
              label: newFieldLabel,
              value: newFieldValue,
              bonus: newFieldIsBonus
            }
          }
        };
      }
      return item;
    }));

    // Reset modal state
    setIsAddFieldModalOpen(false);
    setAddingFieldItemId(null);
    setNewFieldLabel('');
    setNewFieldValue('');
    setNewFieldIsBonus(false);
    messageApi.success('Field added successfully!');
  };

  const handleSavePlaylistTitle = () => {
    if (editedPlaylistTitle.trim()) {
      setPlaylistTitle(editedPlaylistTitle);
      setIsEditingPlaylistTitle(false);
      messageApi.success('Playlist title updated!');
    } else {
      messageApi.warning('Title cannot be empty.');
    }
  };

  const fetchAIInfoForItem = async (item: any) => {
    // Prepare the context from the item's fields
    const itemInfo = Object.entries(item.fields || {})
      .map(([key, field]: [string, any]) => `${field.label || key}: ${field.value}`)
      .join('\n');

    const prompt = `Based on the following information about a music video, please provide additional details that might be useful (such as genre, release year if not provided, album name, movie or video game it was used in, etc.).
Replace data received in input by data collected on the internet for this song. Try to match the original formatting as much as possible.
Do not put "Notes" in the output fields, the target is to find information about the original song so do not hesitate to overwrite existing fields if you have better information.:

${itemInfo}

Please respond ONLY with key-value pairs in this exact format:
Key: [value]

Keep each field on a separate line. Be concise.`;

    // Call OpenAI API
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides structured information about music videos. Always respond with key-value pairs in the format "Key: Value" on separate lines. Be concise and only provide factual information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI request failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Check for incomplete response
    const choice = data.choices?.[0];
    if (!choice || !choice.message || !choice.message.content) {
      throw new Error('Invalid AI response format');
    }

    const finishReason = choice.finish_reason;
    if (finishReason === 'length') {
      messageApi.warning('AI response was cut off. Try asking again or increase max_tokens.');
    }

    const aiResponse = choice.message.content;

    // Parse the AI response and add fields
    const lines = aiResponse.split('\n').filter((line: string) => line.includes(':'));
    const newFields: any = {};

    lines.forEach((line: string) => {
      const [label, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const key = labelToCamelCase(label.trim());

      if (label && value) {
        const fieldType = detectFieldType(key, label.trim());
        newFields[key] = {
          type: fieldType,
          label: label.trim(),
          value: fieldType === 'year' ? parseInt(value) || value : value,
          bonus: false // All AI fields are mandatory
        };
      }
    });

    return newFields;
  };

  const handleAskAI = async (item: any) => {
    if (!apiKey || !baseURL) {
      messageApi.error('Please configure AI settings first in the AI Setup page.');
      return;
    }

    setAiLoadingItemId(item.id);

    try {
      const newFields = await fetchAIInfoForItem(item);

      if (Object.keys(newFields).length > 0) {
        // Open modal for user to select fields
        const fieldKeys = Object.keys(newFields);
        setPendingFields(newFields);
        setPendingItemId(item.id);
        setSelectedFieldKeys(fieldKeys); // All selected by default
        setIsFieldSelectionModalOpen(true);
      } else {
        messageApi.info('No new information was provided by AI.');
      }
    } catch (error: any) {
      console.error('AI request error:', error);
      messageApi.error(`Failed to get AI response: ${error.message}`);
    } finally {
      setAiLoadingItemId(null);
    }
  };

  const handleBatchAI = async () => {
    if (!apiKey || !baseURL) {
      messageApi.error('Please configure AI settings first in the AI Setup page.');
      return;
    }

    if (items.length === 0) {
      messageApi.info('No songs to process.');
      return;
    }

    setIsBatchProcessing(true);
    setBatchCancelRequested(false);
    setBatchProgress({ current: 0, total: items.length });

    const results = { success: [] as string[], failed: [] as { id: string; title: string; error: string }[] };

    for (let i = 0; i < items.length; i++) {
      if (batchCancelRequested) {
        messageApi.info('Batch processing cancelled.');
        break;
      }

      const item = items[i];
      setBatchProgress({ current: i + 1, total: items.length });

      try {
        const newFields = await fetchAIInfoForItem(item);

        if (Object.keys(newFields).length > 0) {
          // Auto-accept all fields without modal and overwrite all existing fields
          setItems(prevItems => prevItems.map(prevItem => {
            if (prevItem.id === item.id) {
              return {
                ...prevItem,
                fields: newFields // Replace all fields with AI-generated ones
              };
            }
            return prevItem;
          }));

          results.success.push(item.fields?.title?.value || item.title || `Song ${i + 1}`);
        } else {
          results.failed.push({
            id: item.id,
            title: item.fields?.title?.value || item.title || `Song ${i + 1}`,
            error: 'No new information provided'
          });
        }

      } catch (error: any) {
        console.error(`AI request error for item ${item.id}:`, error);
        results.failed.push({
          id: item.id,
          title: item.fields?.title?.value || item.title || `Song ${i + 1}`,
          error: error.message
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsBatchProcessing(false);
    setBatchCancelRequested(false);

    // Show summary
    if (results.success.length > 0 && results.failed.length === 0) {
      messageApi.success(`Successfully processed all ${results.success.length} songs with AI information!`);
    } else if (results.success.length > 0 && results.failed.length > 0) {
      messageApi.warning(`Processed ${results.success.length} songs successfully, ${results.failed.length} failed. Check console for details.`);
    } else if (results.failed.length > 0) {
      messageApi.error(`Failed to process all ${results.failed.length} songs. Check console for details.`);
    }

    if (results.failed.length > 0) {
      console.log('Batch AI processing failures:', results.failed);
    }
  };

  const handleCancelBatchAI = () => {
    setBatchCancelRequested(true);
  };

  const handleFieldSelectionOk = () => {
    if (!pendingItemId || selectedFieldKeys.length === 0) {
      messageApi.info('No fields were selected.');
      setIsFieldSelectionModalOpen(false);
      return;
    }

    const fieldsToAdd: any = {};
    selectedFieldKeys.forEach(key => {
      fieldsToAdd[key] = {
        ...pendingFields[key],
        bonus: false // All AI fields are mandatory
      };
    });

    setItems(items.map(i => {
      if (i.id === pendingItemId) {
        return {
          ...i,
          fields: {
            ...i.fields,
            ...fieldsToAdd
          }
        };
      }
      return i;
    }));

    messageApi.success(`Added ${selectedFieldKeys.length} field(s) from AI!`);

    // Reset modal state
    setIsFieldSelectionModalOpen(false);
    setPendingFields({});
    setPendingItemId(null);
    setSelectedFieldKeys([]);
  };

  const handleFieldSelectionCancel = () => {
    messageApi.info('Field addition cancelled.');
    setIsFieldSelectionModalOpen(false);
    setPendingFields({});
    setPendingItemId(null);
    setSelectedFieldKeys([]);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    messageApi.success('Item removed from playlist!');
  };

  const handleToggleMandatory = (itemId: string, fieldKey: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.fields && item.fields[fieldKey]) {
        const field = item.fields[fieldKey];
        return {
          ...item,
          fields: {
            ...item.fields,
            [fieldKey]: {
              ...field,
              bonus: !field.bonus // Toggle bonus status
            }
          }
        };
      }
      return item;
    }));
  };

  const handleOpenVideoPreview = (itemId: string) => {
    setSelectedVideoItemId(itemId);
    setIsVideoPreviewModalOpen(true);
  };

  const handleCloseVideoPreview = () => {
    setIsVideoPreviewModalOpen(false);
    setSelectedVideoItemId(null);
  };

  const handleTimeRangeConfirm = (startMs: number, endMs: number) => {
    if (!selectedVideoItemId) return;

    setItems(items.map(item => {
      if (item.id === selectedVideoItemId) {
        return {
          ...item,
          startTimeMs: startMs,
          endTimeMs: endMs
        };
      }
      return item;
    }));

    messageApi.success(`Time range saved: ${formatTimeDisplay(startMs)} - ${formatTimeDisplay(endMs)}`);
    handleCloseVideoPreview();
  };

  const formatTimeDisplay = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExportPlaylist = () => {
    // Build the JSON structure according to the specified format
    const exportData = {
      name: playlistTitle,
      songs: items.map(item => {
        const bonusFields: Array<{ key: string; points: number; value: string }> = [];
        const pointFields: Array<{ key: string; points: number; value: string }> = [];

        // Separate fields into bonus and mandatory (point) fields
        if (item.fields) {
          Object.entries(item.fields).forEach(([key, field]: [string, any]) => {
            const fieldData = {
              key: key,
              points: 1, // Default points, can be customized later
              value: String(field.value || '')
            };

            if (field.bonus) {
              bonusFields.push(fieldData);
            } else {
              pointFields.push(fieldData);
            }
          });
        }

        return {
          url: `https://www.youtube.com/watch?v=${item.id}`,
          starts_at_ms: item.startTimeMs || 0,
          guess_duration_ms: item.endTimeMs ? (item.endTimeMs - (item.startTimeMs || 0)) : 30000,
          point_fields: pointFields,
          bonus_fields: bonusFields
        };
      })
    };

    // Create a blob and download the file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlistTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_playlist.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    messageApi.success('Playlist exported successfully!');
  };

  const handleImportPlaylist = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      messageApi.error('Please select a JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validate the structure
        if (!importedData.name || !Array.isArray(importedData.songs)) {
          throw new Error('Invalid file format. Expected structure: { name: string, songs: array }');
        }

        // Convert imported data back to internal format
        const convertedItems: any[] = [];

        for (let i = 0; i < importedData.songs.length; i++) {
          const song = importedData.songs[i];

          // Validate song structure
          if (!song.url || typeof song.url !== 'string') {
            messageApi.warning(`Skipping song ${i + 1}: Missing or invalid URL`);
            continue;
          }

          // Extract video ID from YouTube URL
          const videoId = extractVideoIdFromUrl(song.url);
          if (!videoId) {
            messageApi.warning(`Skipping song ${i + 1}: Invalid YouTube URL format`);
            continue;
          }

          // Convert fields back to internal format
          const fields: any = {};

          // Process point fields (mandatory)
          if (Array.isArray(song.point_fields)) {
            song.point_fields.forEach((field: any) => {
              if (field.key && field.value !== undefined) {
                fields[field.key] = {
                  type: detectFieldType(field.key, field.key),
                  label: field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                  value: field.value,
                  bonus: false
                };
              }
            });
          }

          // Process bonus fields
          if (Array.isArray(song.bonus_fields)) {
            song.bonus_fields.forEach((field: any) => {
              if (field.key && field.value !== undefined) {
                fields[field.key] = {
                  type: detectFieldType(field.key, field.key),
                  label: field.key.charAt(0).toUpperCase() + field.key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                  value: field.value,
                  bonus: true
                };
              }
            });
          }

          // Create item object
          const item = {
            id: videoId,
            title: fields.title?.value || `Imported Song ${i + 1}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            fields: fields,
            startTimeMs: song.starts_at_ms || 0,
            endTimeMs: song.starts_at_ms + (song.guess_duration_ms || 30000)
          };

          convertedItems.push(item);
        }

        if (convertedItems.length === 0) {
          messageApi.error('No valid songs found in the imported file.');
          return;
        }

        // Update the playlist
        setPlaylistTitle(importedData.name);
        setItems(convertedItems);

        messageApi.success(`Successfully imported ${convertedItems.length} songs from "${importedData.name}"!`);

      } catch (error: any) {
        console.error('Import error:', error);
        messageApi.error(`Failed to import playlist: ${error.message}`);
      }
    };

    reader.onerror = () => {
      messageApi.error('Failed to read the file.');
    };

    reader.readAsText(file);

    // Reset the file input so the same file can be selected again
    event.target.value = '';
  };

  const extractVideoIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);

      // Handle standard YouTube URLs
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        return urlObj.searchParams.get('v');
      }

      // Handle youtu.be URLs
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleSaveField = (itemId: string, fieldKey: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.fields && item.fields[fieldKey]) {
        const field = item.fields[fieldKey];
        let newValue: any = editedValue;

        // Convert Dayjs to year number for year type
        if (field.type === 'year' && editedValue instanceof dayjs) {
          newValue = (editedValue as Dayjs).year();
        }

        return {
          ...item,
          fields: {
            ...item.fields,
            [fieldKey]: {
              ...field,
              value: newValue
            }
          }
        };
      }
      return item;
    }));
    setEditingField(null);
    setEditedValue(null);
  };

  const handleDeleteField = (itemId: string, fieldKey: string, fieldLabel: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.fields) {
        const remainingFields = { ...item.fields };
        delete remainingFields[fieldKey];
        return {
          ...item,
          fields: remainingFields
        };
      }
      return item;
    }));
    messageApi.success(`Field "${fieldLabel}" deleted successfully!`);
  };

  const renderFieldDisplay = (item: any, fieldKey: string, field: any) => {
    const isEditing = editingField?.itemId === item.id && editingField?.fieldKey === fieldKey;

    if (isEditing) {
      // Render edit mode based on field type
      switch (field.type) {
        case 'year':
          return (
            <Flex align="center" gap="small" style={{ display: 'inline-flex' }}>
              <DatePicker
                picker="year"
                value={editedValue as Dayjs}
                onChange={(date) => setEditedValue(date)}
                style={{ width: '120px' }}
              />
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                style={{ backgroundColor: '#52c41a' }}
                onClick={() => handleSaveField(item.id, fieldKey)}
              />
            </Flex>
          );
        case 'text':
        default:
          return (
            <Flex align="center" gap="small" style={{ display: 'inline-flex' }}>
              <Input
                autoFocus
                value={editedValue as string}
                onChange={e => setEditedValue(e.target.value)}
                onPressEnter={() => handleSaveField(item.id, fieldKey)}
                style={{ width: '200px' }}
              />
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                shape="round"
                style={{ backgroundColor: '#52c41a' }}
                onClick={() => handleSaveField(item.id, fieldKey)}
              />
            </Flex>
          );
      }
    }

    // Render display mode
    const displayValue = field.type === 'year' ? field.value : (field.value || 'Unknown');
    const isMandatory = !field.bonus; // Mandatory when bonus is false
    return (
      <span>
        <b>{displayValue}</b>
        <Button
          type="text"
          icon={isMandatory ? <StarFilled style={{ color: '#ffd700' }} /> : <StarOutlined />}
          size="small"
          style={{ marginLeft: 8 }}
          onClick={() => handleToggleMandatory(item.id, fieldKey)}
          title={isMandatory ? 'Mandatory question (click to make bonus)' : 'Bonus question (click to make mandatory)'}
        />
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          onClick={() => {
            setEditingField({ itemId: item.id, fieldKey });
            if (field.type === 'year') {
              setEditedValue(dayjs().year(field.value));
            } else {
              setEditedValue(field.value || '');
            }
          }}
        />
        <Button
          type="text"
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDeleteField(item.id, fieldKey, field.label || fieldKey)}
          title="Delete field"
        />
      </span>
    );
  };

  const renderTitleEdit = (item: any) => {
    const isEditing = editingField?.itemId === item.id && editingField?.fieldKey === 'title';

    if (isEditing) {
      return (
        <Flex align="center" gap="small">
          <Input
            autoFocus
            value={editedValue as string}
            onChange={e => setEditedValue(e.target.value)}
            onPressEnter={() => handleSaveField(item.id, 'title')}
          />
          <Button
            type="primary"
            size="small"
            shape="circle"
            icon={<CheckOutlined />}
            style={{ backgroundColor: '#52c41a' }}
            onClick={() => handleSaveField(item.id, 'title')}
          />
        </Flex>
      );
    }

    return (
      <Flex align="center" gap="small">
        <span>{item.fields?.title?.value || item.title}</span>
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          onClick={() => {
            setEditingField({ itemId: item.id, fieldKey: 'title' });
            setEditedValue(item.fields?.title?.value || item.title);
          }}
        />
      </Flex>
    );
  };

  useEffect(() => {
    if (id && isReady === true) retrievePlaylistItems(id);
  }, [id, isReady]);

  const pendingItem = items.find(i => i.id === pendingItemId);

  return (
    <Spin spinning={loading === true} wrapperClassName="spin-wrapper h-full">
      <Flex vertical className="w-full h-full overflow-hidden">
        {isEditingPlaylistTitle ? (
          <Flex align="center" justify="center" gap="small" className="mb-4">
            <Input
              autoFocus
              value={editedPlaylistTitle}
              onChange={e => setEditedPlaylistTitle(e.target.value)}
              onPressEnter={handleSavePlaylistTitle}
              className="text-3xl text-center"
              style={{ maxWidth: '400px' }}
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              style={{ backgroundColor: '#52c41a' }}
              onClick={handleSavePlaylistTitle}
            />
          </Flex>
        ) : (
          <Flex align="center" justify="space-between" gap="small" className="mb-4">
            <Flex align="flex-end" gap="small">
              <h1
                className="text-3xl text-center cursor-pointer hover:text-purple-400"
                onClick={() => {
                  setEditedPlaylistTitle(playlistTitle);
                  setIsEditingPlaylistTitle(true);
                }}
              >
                {playlistTitle}
              </h1>
              <Button
                type="text"
                icon={<EditOutlined className="text-xl" />}
                onClick={() => {
                  setEditedPlaylistTitle(playlistTitle);
                  setIsEditingPlaylistTitle(true);
                }}
              />
            </Flex>
            <Flex gap="small">
              {isBatchProcessing ? (
                <Button
                  type="default"
                  danger
                  onClick={handleCancelBatchAI}
                  disabled={batchCancelRequested}
                >
                  {batchCancelRequested ? 'Cancelling...' : 'Cancel AI Processing'}
                </Button>
              ) : (
                <Button
                  type="default"
                  icon={<RobotOutlined />}
                  onClick={handleBatchAI}
                  disabled={items.length === 0 || !apiKey || !baseURL}
                >
                  Get AI Info for All
                </Button>
              )}
              <Button
                type="default"
                icon={<UploadOutlined />}
                onClick={handleImportPlaylist}
                disabled={isBatchProcessing}
              >
                Import Playlist
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportPlaylist}
                disabled={items.length === 0 || isBatchProcessing}
              >
                Export Playlist
              </Button>
            </Flex>
          </Flex>
        )}
        {isBatchProcessing && (
          <div className="mb-4 p-4 border border-solid border-blue-300 bg-blue-50 rounded">
            <Flex align="center" gap="middle">
              <Spin size="small" />
              <span className="text-blue-700 font-medium">
                Processing song {batchProgress.current} of {batchProgress.total}...
              </span>
            </Flex>
          </div>
        )}
        <Flex vertical gap="middle" className="overflow-auto">
          {items.length === 0 && (
            <p>No items found in this playlist.</p>
          )}
          {items.map((item) => (
            <Card
              key={item.id}
              title={renderTitleEdit(item)}
              className="w-full h-50"
              extra={
                <Flex gap="small">
                  <Button
                    type="default"
                    icon={<RobotOutlined />}
                    size="small"
                    loading={aiLoadingItemId === item.id}
                    disabled={isBatchProcessing}
                    onClick={() => handleAskAI(item)}
                    title="Ask AI for more information"
                  >
                    AI Info
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="small"
                    disabled={isBatchProcessing}
                    onClick={() => {
                      setAddingFieldItemId(item.id);
                      setIsAddFieldModalOpen(true);
                    }}
                  >
                    Add Field
                  </Button>
                  <Popconfirm
                    title="Remove Item"
                    description={`Are you sure you want to remove "${item.fields?.title?.value || item.title || 'this item'}" from the playlist?`}
                    onConfirm={() => handleDeleteItem(item.id)}
                    okText="Remove"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      title="Remove from playlist"
                    >
                      Remove
                    </Button>
                  </Popconfirm>
                </Flex>
              }
            >
              <Flex justify="flex-start" align="flex-start" gap="middle">
                {item?.thumbnail && (
                  <Flex vertical gap="small">
                    <div
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        display: 'inline-block'
                      }}
                      onClick={() => handleOpenVideoPreview(item.id)}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.fields?.title?.value || item.title}
                        style={{ display: 'block' }}
                      />
                      <div
                        className="thumbnail-overlay"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        <ClockCircleOutlined
                          style={{
                            fontSize: '48px',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>
                    {item.startTimeMs !== undefined && item.endTimeMs !== undefined && (
                      <div style={{ fontSize: '11px', textAlign: 'center', color: '#52c41a' }}>
                        ⏱️ {formatTimeDisplay(item.startTimeMs)} - {formatTimeDisplay(item.endTimeMs)}
                      </div>
                    )}
                  </Flex>
                )}
                <Flex vertical style={{ height: `${Math.round((Object.keys(item.fields).length - 1) / 2) * 24}px` }} className="w-full" gap="small" wrap>
                  {item.fields && Object.entries(item.fields).map(([fieldKey, field]: [string, any]) => {
                    if (fieldKey === 'title') return null; // Title is rendered in card header

                    return (
                      <p key={fieldKey} className="max-w-[45%]">
                        {field.label && `${field.label}: `}
                        {renderFieldDisplay(item, fieldKey, field)}
                      </p>
                    );
                  })}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>

      <Modal
        title="Add New Field"
        centered
        open={isAddFieldModalOpen}
        onOk={handleAddField}
        onCancel={() => {
          setIsAddFieldModalOpen(false);
          setAddingFieldItemId(null);
          setNewFieldLabel('');
          setNewFieldValue('');
          setNewFieldIsBonus(false);
        }}
        okText="Add"
        cancelText="Cancel"
      >
        <Flex vertical gap="middle">
          <div>
            <label>Label:</label>
            <Input
              placeholder="Enter field label (e.g., 'Release Date')"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
            />
          </div>
          <div>
            <label>Value:</label>
            <Input
              placeholder="Enter field value"
              value={newFieldValue}
              onChange={e => setNewFieldValue(e.target.value)}
            />
          </div>
          <div>
            <Checkbox
              checked={newFieldIsBonus}
              onChange={e => setNewFieldIsBonus(e.target.checked)}
            >
              Mark as Bonus Question
            </Checkbox>
          </div>
          {newFieldLabel && (
            <p style={{ fontSize: '12px', color: '#888' }}>
              Field key will be: <b>{labelToCamelCase(newFieldLabel)}</b>
            </p>
          )}
        </Flex>
      </Modal>

      {/* Field Selection Modal */}
      <Modal
        title="Select Fields to Add"
        open={isFieldSelectionModalOpen}
        onOk={handleFieldSelectionOk}
        onCancel={handleFieldSelectionCancel}
        okText="Add Selected Fields"
        cancelText="Cancel"
        width={600}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            The AI has suggested the following fields. Select which ones you want to add:
          </p>
          <Checkbox.Group
            style={{ width: '100%' }}
            value={selectedFieldKeys}
            onChange={(checkedValues) => {
              setSelectedFieldKeys(checkedValues as string[]);
            }}
          >
            <Flex vertical gap="middle" className="w-full">
              {Object.keys(pendingFields).map((key) => {
                const field = pendingFields[key];
                const exists = pendingItem?.fields?.[key];
                return (
                  <div
                    key={key}
                    className="w-full p-1.5 border border-solid rounded"
                    style={{
                      borderColor: exists ? '#fa8c16' : '#d9d9d9',
                      backgroundColor: exists ? '#fff7e6' : '#f0f0f0'
                    }}
                  >
                    <Checkbox value={key} className="w-full">
                      <div className="text-black">
                        <div className="font-bold mb-1">
                          {field.label}
                          {exists && <span className="text-orange-500 ml-2">(will overwrite)</span>}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {field.value}
                        </div>
                      </div>
                    </Checkbox>
                  </div>
                );
              })}
            </Flex>
          </Checkbox.Group>
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        title="Select Video Time Range"
        open={isVideoPreviewModalOpen}
        onCancel={handleCloseVideoPreview}
        footer={null}
        width={900}
        centered
      >
        {selectedVideoItemId && (
          <VideoPreview
            videoId={selectedVideoItemId}
            onTimeRangeSelect={handleTimeRangeConfirm}
            initialStartMs={items.find(i => i.id === selectedVideoItemId)?.startTimeMs || 0}
            initialEndMs={items.find(i => i.id === selectedVideoItemId)?.endTimeMs || 30000}
          />
        )}
      </Modal>

      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        style={{ display: 'none' }}
      />
    </Spin>
  );
};

export default PlaylistViewer;