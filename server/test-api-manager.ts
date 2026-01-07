import { apiManager } from './src/lib/api-manager';

async function test() {
    console.log('Testing APIManager...');
    
    // 1. Check Initial Status
    console.log('Initial Status:', apiManager.getStatus());

    // 2. Mock Rate Limit
    console.log('\n--- Testing Rate Limit (10 requests) ---');
    try {
        for (let i = 0; i < 12; i++) {
            await apiManager.executeWithRetry('mimo', async (key) => {
                console.log(`Request ${i+1} executed with key: ${key.substring(0, 10)}...`);
                return true;
            });
        }
    } catch (e: any) {
        console.log('Expected Error:', e.message);
    }
    
    console.log('Status after rate limit:', apiManager.getStatus());

    // 3. Mock Key Rotation on Failure
    console.log('\n--- Testing Key Rotation on Failure ---');
    // Force a few failures
    try {
        await apiManager.executeWithRetry('mimo', async (key) => {
            console.log(`Trying key: ${key.substring(0, 10)}...`);
            throw new Error('401 Unauthorized');
        });
    } catch (e: any) {
        console.log('Caught Error:', e.message);
    }
    
    console.log('Status after rotation:', apiManager.getStatus());
}

test();
