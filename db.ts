
/**
 * MongoDB Atlas Data API Service
 * This service allows the frontend to communicate directly with a MongoDB cluster.
 * NOTE: For production, these calls should be proxied through a backend to protect API keys.
 */


// MongoDB Atlas connection details
const DATABASE_NAME = "fastep";
const DATA_SOURCE = "fastep";
const BASE_URL = "https://data.mongodb-api.com/app/data-backend/endpoint/data/v1";
// NOTE: For Data API, you need an API key, not just the connection string. The connection string you provided is for drivers, not the Data API.
// If you have a Data API key, set it below:
const API_KEY = ""; // <-- Set your Data API key here

async function mongoRequest(action: string, collection: string, body: any) {
  if (!API_KEY) {
    console.warn("MongoDB API Key missing. Persistence will fall back to LocalStorage.");
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/action/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Headers": "*",
        "api-key": API_KEY,
      },
      body: JSON.stringify({
        dataSource: DATA_SOURCE,
        database: DATABASE_NAME,
        collection: collection,
        ...body,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error(`MongoDB ${action} failed:`, error);
    return null;
  }
}

export const db = {
  async getAll<T>(collection: string): Promise<T[]> {
    const res = await mongoRequest("find", collection, { filter: {} });
    return res?.documents || [];
  },

  async upsert(collection: string, id: string, data: any) {
    return await mongoRequest("updateOne", collection, {
      filter: { id: id },
      update: { $set: data },
      upsert: true,
    });
  },

  async delete(collection: string, id: string) {
    return await mongoRequest("deleteOne", collection, {
      filter: { id: id },
    });
  },

  async saveBatch(collection: string, documents: any[]) {
    // For simplicity, we clear and re-insert or upsert each. 
    // Data API doesn't have a direct "sync whole collection" without multiple calls or custom endpoints.
    // In this app, we'll upsert individual changes as they happen.
    for (const doc of documents) {
      await this.upsert(collection, doc.id, doc);
    }
  }
};
