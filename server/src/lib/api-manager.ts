import { config } from '../config';

interface ProviderStats {
    success: number;
    failed: number;
    retries: number;
}

export class APIManager {
    private static instance: APIManager;
    
    // Key Management
    private mimoKeys: string[] = [];
    private currentMimoIndex = 0;
    private geminiKey: string = '';

    // Rate Limiting
    private requestTimestamps: number[] = [];
    private readonly MAX_REQUESTS_PER_MINUTE = 10;
    private readonly WINDOW_MS = 60 * 1000;

    // Stats
    private stats: Record<string, ProviderStats> = {
        mimo: { success: 0, failed: 0, retries: 0 },
        gemini: { success: 0, failed: 0, retries: 0 }
    };

    private constructor() {
        this.mimoKeys = config.mimoKeys;
        this.geminiKey = config.geminiKey;
        console.log(`[APIManager] Initialized with ${this.mimoKeys.length} Mimo keys and ${this.geminiKey ? 1 : 0} Gemini key.`);
    }

    public static getInstance(): APIManager {
        if (!APIManager.instance) {
            APIManager.instance = new APIManager();
        }
        return APIManager.instance;
    }

    public getStatus() {
        this.cleanupTimestamps();
        return {
            requestsRemaining: Math.max(0, this.MAX_REQUESTS_PER_MINUTE - this.requestTimestamps.length),
            isRateLimited: this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE,
            currentMimoKeyIndex: this.currentMimoIndex,
            totalMimoKeys: this.mimoKeys.length,
            stats: this.stats
        };
    }

    public getMimoKey(): string {
        if (this.mimoKeys.length === 0) return '';
        return this.mimoKeys[this.currentMimoIndex];
    }

    public getGeminiKey(): string {
        return this.geminiKey;
    }

    public rotateMimoKey() {
        if (this.mimoKeys.length <= 1) return;
        this.currentMimoIndex = (this.currentMimoIndex + 1) % this.mimoKeys.length;
        console.log(`[APIManager] Rotated Mimo key to index ${this.currentMimoIndex}`);
    }

    private cleanupTimestamps() {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(t => now - t < this.WINDOW_MS);
    }

    private checkRateLimit() {
        this.cleanupTimestamps();
        if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
            const error: any = new Error('Global rate limit exceeded (429). Please wait a moment.');
            error.status = 429;
            throw error;
        }
    }

    private incrementRequest() {
        this.requestTimestamps.push(Date.now());
    }

    public async executeWithRetry<T>(
        provider: 'mimo' | 'gemini', 
        operation: (apiKey: string) => Promise<T>
    ): Promise<T> {
        this.checkRateLimit();
        this.incrementRequest();

        let attempt = 0;
        const maxRetries = 3;
        
        while (attempt <= maxRetries) {
            try {
                const apiKey = provider === 'mimo' ? this.getMimoKey() : this.getGeminiKey();
                // If no key is available for the provider, throw immediately
                if (!apiKey && provider === 'mimo' && this.mimoKeys.length === 0) throw new Error('No Mimo API keys configured');
                if (!apiKey && provider === 'gemini' && !this.geminiKey) throw new Error('No Gemini API key configured');

                const result = await operation(apiKey);
                this.stats[provider].success++;
                return result;
            } catch (error: any) {
                // If it's a rate limit error from OUR check (429 status we threw above), rethrow it immediately
                if (error.message?.includes('Global rate limit exceeded')) throw error;

                this.stats[provider].failed++;
                
                // Determine if we should retry
                const isAuthError = error.message?.includes('401') || error.status === 401 || error.message?.includes('API key');
                const isRateLimit = error.message?.includes('429') || error.status === 429;
                
                console.warn(`[APIManager] ${provider} request failed (Attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);

                // If critical auth error or rate limit on MIMO, rotate key immediately
                if ((isAuthError || isRateLimit) && provider === 'mimo') {
                    this.rotateMimoKey();
                }

                if (attempt === maxRetries) {
                    throw error;
                }

                this.stats[provider].retries++;
                attempt++;
                
                // Exponential backoff: 1s, 2s, 4s...
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(`[APIManager] Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }
}

export const apiManager = APIManager.getInstance();
