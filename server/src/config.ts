import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file
dotenv.config();

interface AIConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'mimo';
  apiKey: string;
  model: string;
  mimoKeys: string[];
  geminiKey: string;
  geminiModel: string;
}

const loadConfig = (): AIConfig => {
  const mimoKeys = [
    process.env.MIMO_API_KEY_1,
    process.env.MIMO_API_KEY_2,
    process.env.MIMO_API_KEY_3
  ].filter(Boolean) as string[];

  const geminiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  // 1. Try Environment Variables (Priority)
  if (process.env.AI_API_KEY || process.env.MIMO_API_KEY_1 || process.env.GEMINI_API_KEY) {
    return {
      provider: (process.env.AI_PROVIDER as any) || 'gemini',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.MODEL_NAME || 'gemini-1.5-flash',
      mimoKeys,
      geminiKey,
      geminiModel
    };
  }

  // 2. Try Local Config JSON (Dev only, not recommended for prod)
  // Look in root directory for config.json (standardized location)
  const rootConfigPath = path.join(__dirname, '../../../config.json');
  if (fs.existsSync(rootConfigPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(rootConfigPath, 'utf-8'));
      if (fileConfig.mimoKeys || fileConfig.geminiKey) {
        console.warn('WARNING: Loading API Keys from local config.json file.');
        return {
          provider: fileConfig.provider || 'gemini',
          apiKey: fileConfig.apiKey || '',
          model: fileConfig.model || 'gemini-1.5-flash',
          mimoKeys: fileConfig.mimoKeys || [],
          geminiKey: fileConfig.geminiKey || '',
          geminiModel: fileConfig.geminiModel || 'gemini-2.5-flash-lite'
        };
      }
    } catch (e) {
      console.error('Error reading config.json:', e);
    }
  }

  const configPath = path.join(__dirname, '../../config/ai.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (fileConfig.apiKey) {
        console.warn('WARNING: Loading API Key from local JSON file. Ensure this file is not committed to GitHub.');
        return {
          provider: fileConfig.provider || 'gemini',
          apiKey: fileConfig.apiKey,
          model: fileConfig.model || 'gemini-1.5-flash',
          mimoKeys,
          geminiKey,
          geminiModel
        };
      }
    } catch (e) {
      console.error('Error reading config file:', e);
    }
  }

  console.warn('WARNING: AI Configuration missing. AI_API_KEY environment variable is not set.');
  return {
    provider: 'mimo',
    apiKey: '',
    model: 'mimo-v2-flash',
    mimoKeys,
    geminiKey,
    geminiModel
  };
};

export const config = loadConfig();
export const PORT = process.env.PORT || 3000;
