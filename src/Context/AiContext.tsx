import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const AI_CONFIG_STORAGE_KEY = 'neon-beat-ai-config';

interface AiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

interface AiContextType {
  apiKey: string;
  baseURL: string;
  model: string;
  setApiKey: (key: string) => void;
  setBaseURL: (url: string) => void;
  updateConfig: (config: { apiKey: string; baseURL: string, model: string }) => void;
}

const AiContext = createContext<AiContextType | null>(null);

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};

interface AiProviderProps {
  children: ReactNode;
}

// Load configuration from local storage
const loadConfigFromStorage = (): AiConfig => {
  try {
    const stored = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return {
        apiKey: config.apiKey || '',
        baseURL: config.baseURL || '',
        model: config.model || ''
      };
    }
  } catch (error) {
    console.error('Failed to load AI config from storage:', error);
  }
  // Return defaults if nothing in storage or error occurred
  return {
    apiKey: '',
    baseURL: '',
    model: ''
  };
};

// Save configuration to local storage
const saveConfigToStorage = (config: AiConfig) => {
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save AI config to storage:', error);
  }
};

export const AiProvider = ({ children }: AiProviderProps) => {
  // Initialize state from local storage
  const initialConfig = loadConfigFromStorage();
  const [apiKey, setApiKey] = useState<string>(initialConfig.apiKey);
  const [baseURL, setBaseURL] = useState<string>(initialConfig.baseURL);
  const [model, setModel] = useState<string>(initialConfig.model);

  // Save to local storage whenever any value changes
  useEffect(() => {
    saveConfigToStorage({ apiKey, baseURL, model });
  }, [apiKey, baseURL, model]);

  const updateConfig = (config: { apiKey: string; baseURL: string, model: string }) => {
    setApiKey(config.apiKey);
    setBaseURL(config.baseURL);
    setModel(config.model);
  };

  return (
    <AiContext.Provider value={{ apiKey, baseURL, setApiKey, setBaseURL, model, updateConfig }}>
      {children}
    </AiContext.Provider>
  );
};

export default AiContext;