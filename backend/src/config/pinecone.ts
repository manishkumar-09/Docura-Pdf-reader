import { Pinecone } from "@pinecone-database/pinecone";
import { configs } from "./env";

if (!configs.PINECONE_API_KEY) {
  throw new Error("Pinecone environment or api ke is missing");
}

async function PineConeConfig() {
  try {
    const pinecone = new Pinecone({
      apiKey: configs.PINECONE_API_KEY,
    });
    return pinecone;
  } catch (err) {
    console.log("err", err);
    throw new Error("Failed to intialize pinecone client");
  }
}

export const pinecone = PineConeConfig();
