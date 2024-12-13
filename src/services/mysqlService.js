import { mysqlPool } from '../config/database.js';

export async function getAllContent() {
  try {
    const [rows] = await mysqlPool.execute('SELECT id, content FROM articles');
    return rows;
  } catch (error) {
    console.error('Error fetching content from MySQL:', error);
    throw error;
  }
}

export async function getContentById(id) {
  try {
    const [rows] = await mysqlPool.execute('SELECT id, content FROM articles WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching content by id:', error);
    throw error;
  }
} 