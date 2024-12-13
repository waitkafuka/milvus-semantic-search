import OpenAI from 'openai';
import dotenv from 'dotenv';
import { VectorCache } from './cacheService.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function getEmbedding(text) {
  try {
    // 检查Redis缓存中是否已存在
    const cachedVector = await VectorCache.get(text);
    if (cachedVector) {
      return cachedVector;
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    if (!Array.isArray(embedding) || embedding.length === 0 || typeof embedding[0] !== 'number') {
      throw new Error('Invalid embedding format from OpenAI');
    }
    
    // 将结果存入Redis缓存
    await VectorCache.set(text, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
} 