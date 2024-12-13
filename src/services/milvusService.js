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
        await milvusClient.useDatabase(milvusConfig.database);
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
            //   - IVF_FLAT: 基于量化的索引，在召���率和性能间取得平衡
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
        // 确保向量是数字数组
        if (!Array.isArray(vector)) {
            throw new Error('Vector must be an array of numbers');
        }

        /**
         * 主要参数说明：
            metric_type: 用于计算向量之间相似度的方法
            L2: 欧几里得距离，数值越小表示越相似
            其他常用选项还有 IP（内积）等
            nprobe: 是一个性能调优参数
            Milvus 使用 IVF（倒排文件）索引将向量分成多个聚类
            nprobe 决定搜索时检查多少个最近的聚类
            值越大，搜索结果越准确，但速度越慢
            值越小，搜索速度越快，但可能会错过一些相似结果
            topk: 返回最相似的 k 个结果
            在这段代码中通过 limit 参数控制
            比如设置为 5 就返回最相似的 5 个向量
            output_fields: 指定要返回的字段
            这里只返回 id，可以根据需要添加其他字段
            这些参数需要根据具体应用场景来调整，比如：
            如果需要更准确的结果，可以增加 nprobe 的值
            如果需要更快的搜索速度，可以减小 nprobe 的值
            如果使用余弦相似度，可以将 metric_type 改为 IP
         */
        const searchResult = await milvusClient.search({
            // 集合名称
            collection_name: milvusConfig.collectionName,
            // 要搜索的向量数组，这里只搜索一个向量
            vectors: [vector],
            // 向量类型：101 表示浮点型向量（FloatVector）
            vector_type: 101,
            search_params: {
                // 指定要搜索的向量字段名
                anns_field: "vector",
                // 返回最相似的 k 个结果
                topk: limit,
                // 距离度量类型：L2 表示欧几里得距离
                metric_type: "L2",
                // nprobe: 搜索时要检查的聚类数量
                // 值越大，搜索越精确但速度越慢
                params: JSON.stringify({ nprobe: 10 }),
            },
            // 要返回的字段，这里只返回 id
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