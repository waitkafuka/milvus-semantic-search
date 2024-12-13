import { milvusClient, milvusConfig } from '../config/database.js';

const VECTOR_DIM = 1536; // OpenAI ada-002 embedding dimension

async function initializeDatabase() {
    try {
        // 检查数据库是否存在
        const databases = await milvusClient.listDatabases();
        const hasDatabase = databases.db_names.includes(milvusConfig.database);

        if (!hasDatabase) {
            // 创建数据库
            await milvusClient.createDatabase({
                db_name: milvusConfig.database
            });
        }

        // 使用指定的数据库
        await milvusClient.useDatabase({ db_name: milvusConfig.database });
    } catch (error) {
        console.error('Error initializing Milvus database:', error);
        throw error;
    }
}

export async function initializeCollection() {
    try {
        // 首先初始化数据库
        await initializeDatabase();

        const collectionName = milvusConfig.collectionName;

        // Check if collection exists
        const hasCollection = await milvusClient.hasCollection({
            collection_name: collectionName,
        });

        if (!hasCollection.value) {
            // Create collection
            await milvusClient.createCollection({
                collection_name: collectionName,
                fields: [
                    {
                        name: 'id',
                        description: 'MySQL ID',
                        data_type: 'Int64',
                        is_primary_key: true,
                        autoID: false,
                    },
                    {
                        name: 'vector',
                        description: 'Embedding vector',
                        data_type: 'FloatVector',
                        dim: VECTOR_DIM,
                    },
                ],
            });

            // Create index
            // 为向量字段创建索引以加速搜索
            // 参数说明:
            // collection_name: 集合名称，指定要在哪个集合上创建索引
            // field_name: 字段名称，指定要为哪个字段创建索引，这里是向量字段
            // index_type: 索引类型
            //   - IVF_FLAT: 基于量化的索引，在召回率和性能间取得平衡
            //   - 其他可选值: IVF_SQ8/IVF_PQ(更快但精度较低), FLAT(最准确但最慢)
            // metric_type: 距离计算方式
            //   - L2: 欧几里得距离，适用于大多数场景
            //   - IP: 内积距离，适用于归一化向量
            // params: 索引参数
            //   - nlist: 聚类簇的数量，值越大构建索引越慢但搜索更精确
            //     建议值: 数据规模<10000时设为1024，更大规模可相应增加
            await milvusClient.createIndex({
                collection_name: collectionName,
                field_name: 'vector',
                index_type: 'IVF_FLAT',
                metric_type: 'L2',
                params: { nlist: 1024 },
            });
        }

        // Load collection
        await milvusClient.loadCollectionSync({
            collection_name: collectionName,
        });

    } catch (error) {
        console.error('Error initializing Milvus collection:', error);
        throw error;
    }
}

export async function insertVector(id, vector) {
    try {
        // 确保使用正确的数据库
        await milvusClient.useDatabase({ db_name: milvusConfig.database });

        const insertData = [{
            id: id,
            vector: vector
        }];

        await milvusClient.insert({
            collection_name: milvusConfig.collectionName,
            fields_data: insertData
        });
    } catch (error) {
        console.error('Error inserting vector:', error);
        throw error;
    }
}

export async function searchSimilar(vector, limit = 5) {
    try {

        // 确保使用正确的数据库
        await milvusClient.useDatabase({ db_name: milvusConfig.database });
        console.log('milvusConfig.database', milvusClient.metadata.get('dbname'));

        // 确保向量是数字数组
        if (!Array.isArray(vector)) {
            throw new Error('Vector must be an array of numbers');
        }

        const collectionName = milvusConfig.collectionName;

        // 检查集合是否存在
        const hasCollection = await milvusClient.hasCollection({
            collection_name: collectionName,
        });

        if (!hasCollection.value) {
            throw new Error(`Collection ${collectionName} does not exist. Please run initialization first.`);
        }

        // 确保集合已加载
        await milvusClient.loadCollectionSync({
            collection_name: collectionName,
        });

        const searchResult = await milvusClient.search({
            collection_name: milvusConfig.collectionName,
            vectors: [vector],
            search_params: {
                anns_field: "vector",
                topk: limit,
                metric_type: "L2",
                params: JSON.stringify({ nprobe: 10 }),
            },
            output_fields: ['id']
        });

        if (!searchResult || !searchResult.results) {
            throw new Error('Invalid search result from Milvus');
        }

        return searchResult.results.map(result => ({
            id: parseInt(result.id),
            score: result.score,
        }));
    } catch (error) {
        console.error('Error searching vectors:', error);
        throw error;
    }
} 