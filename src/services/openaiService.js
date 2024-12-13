import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    // 确保返回的是数字数组
    const embedding = response.data[0].embedding;
    if (!Array.isArray(embedding) || embedding.length === 0 || typeof embedding[0] !== 'number') {
      throw new Error('Invalid embedding format from OpenAI');
    }
    
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
} 