import { Router } from "express";
import {
  queryPdfController,
  uploadPdfController,
} from "../controller/chatController";
import { upload } from "../middleware/multer";
const router = Router();

router.post("/upload", upload.array("files"), uploadPdfController);
router.post("/query", queryPdfController);

export default router;
