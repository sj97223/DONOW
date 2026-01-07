import express from 'express';
import { config } from '../config';
import { GeminiProvider } from '../providers/gemini';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { AIProvider } from '../providers/base';

const router = express.Router();

router.get('/status', (req, res) => {
  const hasKey = !!config.apiKey && config.apiKey.length > 0;
  res.json({
    status: hasKey ? 'verified' : 'missing',
    provider: config.provider,
    model: config.model
  });
});

let provider: AIProvider;

// Lazy initialization or switch based on config
const getProvider = (): AIProvider => {
  if (provider) return provider;
  
  switch (config.provider) {
    case 'openai':
      provider = new OpenAIProvider();
      break;
    case 'anthropic':
      provider = new AnthropicProvider();
      break;
    case 'gemini':
    default:
      provider = new GeminiProvider();
      break;
  }
  return provider;
};

router.post('/breakdown', async (req, res) => {
  try {
    const { taskTitle, context, lang, stepsToKeep } = req.body;
    
    if (!taskTitle) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const ai = getProvider();
    const steps = await ai.breakDownTask(taskTitle, context, lang || 'zh', stepsToKeep);
    
    res.json(steps);
  } catch (error: any) {
    console.error('AI Breakdown Error:', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: 'Failed to generate steps',
      details: error.message 
    });
  }
});

router.post('/suggest', async (req, res) => {
  try {
    const { taskTitle, lang } = req.body;
    if (!taskTitle) return res.status(400).json({ error: 'Task title is required' });

    const ai = getProvider();
    if (!ai.suggestNextSteps) {
      return res.status(501).json({ error: 'Not implemented by this provider' });
    }
    
    const suggestions = await ai.suggestNextSteps(taskTitle, lang || 'en');
    res.json(suggestions);
  } catch (error: any) {
    console.error('AI Suggest Error:', error);
    res.status(500).json({ error: 'Failed to suggest steps' });
  }
});

export default router;
