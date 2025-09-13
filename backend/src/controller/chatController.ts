import { Request, Response } from "express";
import { ingestPdf, queryPdf } from "../services/rag.service";

export const uploadPdfController = async (req: Request, res: Response) => {
  try {
    const pdfFiles = req.files as Express.Multer.File[];
    const namespace = await ingestPdf(pdfFiles);
    return res.json({ message: "PDFs ingested successfully", namespace });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

export const queryPdfController = async (req: Request, res: Response) => {
  try {
    // if history is undefined so it become default array
    const { question, namespace } = req.body;
    if (!question) {
      return res.status(400).json({ errro: "question is required" });
    }
    // Call service to query Pinecone and get answer from Gemini
    const result = await queryPdf(question, namespace);
    return res.json(result);
  } catch (err: any) {
    console.error(err, err.message);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};
