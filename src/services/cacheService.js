import redisClient from '../config/redis.js';

const VECTOR_PREFIX = 'vector:';
const VECTOR_EXPIRE_TIME = 60 * 60 * 24 * 365; // 1 year in seconds

export class VectorCache {
    static async get(text) {
        const key = VECTOR_PREFIX + text;
        const cachedVector = await redisClient.get(key);
        if (cachedVector) {
            return JSON.parse(cachedVector);
        }
        return null;
    }

    static async set(text, vector) {
        const key = VECTOR_PREFIX + text;
        await redisClient.set(key, JSON.stringify(vector), {
            EX: VECTOR_EXPIRE_TIME
        });
    }
} 