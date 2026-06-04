import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";

const publicFolder = path.resolve(__dirname, "..", "..", "public");
export default {
  directory: publicFolder,

  storage: multer.diskStorage({
    destination: publicFolder,
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `${randomUUID()}${ext}`;

      return cb(null, fileName);
    }
  })
};
