import multer from "multer";
import path from "path";
import fs, { mkdirSync } from "fs";

//create directory if not existed
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

//allowed file types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only pdf's are allowed"), false);
  }
};

export const upload = multer({ storage, fileFilter });
