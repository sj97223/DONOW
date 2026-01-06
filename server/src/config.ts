import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env file
dotenv.config();

interface AIConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

const loadConfig = (): AIConfig => {
  // 1. Try Environment Variables (Priority)
  if (process.env.AI_API_KEY) {
    return {
      provider: (process.env.AI_PROVIDER as any) || 'gemini',
      apiKey: process.env.AI_API_KEY,
      model: process.env.MODEL_NAME || 'gemini-1.5-flash',
    };
  }

  // 2. Try Local Config JSON (Dev only, not recommended for prod)
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
        };
      }
    } catch (e) {
      console.error('Error reading config file:', e);
    }
  }

  throw new Error('AI Configuration missing. Please set AI_API_KEY environment variable.');
};

export const config = loadConfig();
export const PORT = process.env.PORT || 3000;
