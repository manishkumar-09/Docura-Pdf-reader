import { Document } from "langchain/document";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { configs } from "../config/env";
import { pinecone } from "../config/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { makeChain } from "../utils/makechain";

//Ingest uploaded pdf files into pinecone

export const ingestPdf = async (pdfFiles: Express.Multer.File[]) => {
  if (!pdfFiles || pdfFiles.length === 0) {
    throw new Error("No PDF files provided");
  }

  const allDocs: Document[] = [];
  for (const file of pdfFiles) {
    const loader = new PDFLoader(file.path);
    const docs = await loader.load();
    allDocs.push(...docs);
  }

  //split documents into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(allDocs);

  //create embedding
  const embedding = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: configs.GEMINI_API_KEY,
  });

  //unique namespace for current upload
  const namespace = `upload-${Date.now()}`;

  const index = (await pinecone).Index(configs.PINECONE_INDEX_NAME);

  //store embedding in pinecone
  await PineconeStore.fromDocuments(splitDocs, embedding, {
    pineconeIndex: index,
    namespace,
    textKey: "text",
  });
  return namespace; //return namespace for querying
};

export const queryPdf = async (question: string, namespace: string) => {
  if (!question) throw new Error("Question is required");

  const embedding = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: configs.GEMINI_API_KEY,
  });

  const index = (await pinecone).Index(configs.PINECONE_INDEX_NAME);

  //load vector store from the specific namespace
  const vectorStore = await PineconeStore.fromExistingIndex(embedding, {
    pineconeIndex: index,
    textKey: "text",
    namespace,
  });

  const retriever = vectorStore.asRetriever({ k: 5 }); //k means top relevant result
  // You can plug this retriever into your makeChain function
  const chain = makeChain(retriever);
  const response = await chain.invoke({ question, chat_history: [] });

  return response; // Or integrate with RAG chain as needed
};
