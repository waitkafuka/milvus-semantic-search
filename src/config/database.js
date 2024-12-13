import mysql from 'mysql2/promise';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection configuration
export const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// Milvus connection configuration
export const milvusConfig = {
  address: `${process.env.MILVUS_HOST}:${process.env.MILVUS_PORT}`,
  database: process.env.MILVUS_DATABASE,
  collectionName: process.env.MILVUS_COLLECTION,
};

// Create MySQL connection pool
export const mysqlPool = mysql.createPool(mysqlConfig);

// Create Milvus client
export const milvusClient = new MilvusClient(milvusConfig.address); 