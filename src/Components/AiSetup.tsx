import { useContext, useEffect, useState } from "react";
import { Card, Flex, Input, Select, Typography, Button } from "antd";
import { useAi } from "../Context/AiContext";
import MessageContext from "../Context/MessageContext";

const { Title, Text } = Typography;

interface AIEndpoint {
  value: string;
  label: string;
  baseURL: string;
  requiresApiKey: boolean;
  description: string;
  defaultModel?: string;
  availableModels?: string[];
}

const AI_ENDPOINTS: AIEndpoint[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
    description: 'Official OpenAI API with GPT-5',
    defaultModel: 'gpt-5-mini',
    availableModels: ['gpt-5', 'gpt-5-mini']
  },
  {
    value: 'gemini',
    label: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    requiresApiKey: true,
    description: 'Official Gemini API from Google with advanced language models',
    defaultModel: 'gemini-2.5-flash',
    availableModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-pro']
  },
  {
    value: 'custom',
    label: 'Custom Endpoint',
    baseURL: '',
    requiresApiKey: true,
    description: 'Use a custom OpenAI-compatible endpoint',
    defaultModel: 'gpt-3.5-turbo'
  }
];

const AiSetup: React.FC = () => {
  const { apiKey: contextApiKey, baseURL: contextBaseURL, model: contextModel, updateConfig } = useAi();
  const { messageApi } = useContext<any>(MessageContext);

  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('gemini');
  const [customBaseURL, setCustomBaseURL] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const currentEndpoint = AI_ENDPOINTS.find(e => e.value === selectedEndpoint);

  // Initialize from context
  useEffect(() => {
    if (contextApiKey) {
      setApiKey(contextApiKey);
    }
    if (contextModel) {
      setSelectedModel(contextModel);
    }
    if (contextBaseURL) {
      // Find matching endpoint or set to custom
      const matchingEndpoint = AI_ENDPOINTS.find(e => e.baseURL === contextBaseURL);
      if (matchingEndpoint) {
        setSelectedEndpoint(matchingEndpoint.value);
        if (!contextModel && matchingEndpoint.defaultModel) {
          setSelectedModel(matchingEndpoint.defaultModel);
        }
      } else {
        setSelectedEndpoint('custom');
        setCustomBaseURL(contextBaseURL);
      }
    }
  }, [contextApiKey, contextBaseURL, contextModel]);

  // Update selectedModel when currentEndpoint changes
  useEffect(() => {
    if (currentEndpoint?.defaultModel && !selectedModel) {
      setSelectedModel(currentEndpoint.defaultModel);
    }
  }, [currentEndpoint, selectedModel]);

  // Update context when values change
  const handleSaveConfig = () => {
    const baseURL = selectedEndpoint === 'custom' ? customBaseURL : currentEndpoint?.baseURL || '';

    if (!baseURL) {
      messageApi.error('Please provide a valid base URL');
      return;
    }

    if (currentEndpoint?.requiresApiKey && !apiKey) {
      messageApi.error('Please provide an API key');
      return;
    }

    if (!selectedModel) {
      messageApi.error('Please select a model');
      return;
    }

    updateConfig({ apiKey, baseURL, model: selectedModel });
    messageApi.success('AI configuration saved successfully!');
  };

  // Auto-save when endpoint changes
  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
    const endpoint = AI_ENDPOINTS.find(e => e.value === value);
    if (endpoint && endpoint.baseURL) {
      const model = endpoint.defaultModel || selectedModel || 'gpt-3.5-turbo';
      setSelectedModel(model);
      updateConfig({
        apiKey,
        baseURL: endpoint.baseURL,
        model
      });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>AI Setup</Title>
      <Text type="secondary">Configure your AI endpoint compatible with OpenAI library</Text>

      <Card style={{ marginTop: '20px' }}>
        <Flex vertical gap="large">
          {/* Endpoint Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Select AI Endpoint
            </label>
            <Select
              style={{ width: '100%' }}
              value={selectedEndpoint}
              onChange={handleEndpointChange}
              options={AI_ENDPOINTS.map(endpoint => ({
                value: endpoint.value,
                label: endpoint.label,
              }))}
            />
            {currentEndpoint && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                {currentEndpoint.description}
              </Text>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Base URL
            </label>
            {selectedEndpoint === 'custom' ? (
              <Input
                placeholder="https://your-endpoint.com/v1"
                value={customBaseURL}
                onChange={e => setCustomBaseURL(e.target.value)}
                onBlur={handleSaveConfig}
              />
            ) : (
              <Input
                value={currentEndpoint?.baseURL}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            )}
          </div>

          {/* API Key */}
          {currentEndpoint?.requiresApiKey && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                API Key
              </label>
              <Input.Password
                placeholder="Enter your API key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onBlur={handleSaveConfig}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                Your API key is stored locally and never sent to our servers
              </Text>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Model
            </label>
            {currentEndpoint?.availableModels ? (
              <Select
                style={{ width: '100%' }}
                value={selectedModel}
                onChange={setSelectedModel}
                onBlur={handleSaveConfig}
                options={currentEndpoint.availableModels.map(model => ({
                  value: model,
                  label: model,
                }))}
                placeholder="Select a model"
              />
            ) : (
              <Input
                placeholder="Enter model name (e.g., gpt-3.5-turbo)"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                onBlur={handleSaveConfig}
              />
            )}
            {currentEndpoint?.defaultModel && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                Default: {currentEndpoint.defaultModel}
              </Text>
            )}
          </div>

          {/* Save Button */}
          <Button
            type="primary"
            onClick={handleSaveConfig}
            style={{ alignSelf: 'flex-start' }}
          >
            Save Configuration
          </Button>

          {/* Info Section */}
          <Card size="small" style={{ border: '1px solid #d6e4ff' }}>
            <Title level={5}>Using OpenAI-Compatible Endpoints</Title>
            <Text style={{ fontSize: '13px' }}>
              All endpoints listed above are compatible with the OpenAI library.
              You can use them interchangeably by simply changing the base URL and API key.
            </Text>
            {!currentEndpoint?.requiresApiKey && (
              <div style={{ marginTop: '12px' }}>
                <Text strong style={{ fontSize: '13px' }}>
                  ℹ️ This endpoint runs locally and doesn't require an API key
                </Text>
              </div>
            )}
          </Card>
        </Flex>
      </Card>
    </div>
  );
}

export default AiSetup;