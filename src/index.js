import { getAllContent, getContentById } from './services/mysqlService.js';
import { initializeCollection, insertVector, searchSimilar } from './services/milvusService.js';
import { getEmbedding } from './services/openaiService.js';

async function initializeSystem() {
  try {
    // Initialize Milvus collection
    await initializeCollection();
    console.log('Milvus collection initialized');

    // Get all content from MySQL
    const contents = await getAllContent();
    console.log(`Found ${contents.length} items in MySQL`);

    // Process each content and store vectors
    for (const content of contents) {
      const vector = await getEmbedding(content.content);
      await insertVector(content.id, vector);
      console.log(`Processed and stored vector for content ID: ${content.id}`);
    }

    console.log('System initialization completed');
  } catch (error) {
    console.error('Error during system initialization:', error);
  }
}

async function searchContent(query, limit = 5) {
  try {
    // Convert query to vector
    const queryVector = await getEmbedding(query);
    
    // Search similar vectors
    const similarResults = await searchSimilar(queryVector, limit);
    
    // Get content details for each result
    const results = await Promise.all(
      similarResults.map(async (result) => {
        const content = await getContentById(result.id);
        return {
          ...content,
          similarity: result.score,
        };
      })
    );
    
    return results;
  } catch (error) {
    if (error.message.includes('Collection does not exist')) {
      console.error('Collection not initialized. Please run initializeSystem() first.');
      return [];
    }
    console.error('Error during content search:', error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    // 首次运行时，取消下面这行的注释来初始化系统
    await initializeSystem();
    
    // Example search
    const searchQuery = "苹果";
    const searchResults = await searchContent(searchQuery);
    console.log('Search results:', searchResults);
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main().catch(console.error); 