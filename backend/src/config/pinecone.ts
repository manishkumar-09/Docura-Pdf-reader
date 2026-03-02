import { Pinecone } from "@pinecone-database/pinecone";
import { configs } from "./env";

if (!configs.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is missing");
}

async function PineConeConfig() {
  try {
    const pinecone = new Pinecone({
      apiKey: configs.PINECONE_API_KEY,
    });
    return pinecone;
  } catch (err) {
    console.log("err", err);
    throw new Error("Failed to initialize Pinecone client");
  }
}

export const pinecone = PineConeConfig();
