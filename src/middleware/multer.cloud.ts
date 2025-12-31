import { v4 as uuidv4 } from 'uuid';
import  { FileFilterCallback  } from "multer";
import multer from "multer";
import { AppError } from "../utilities/classError";
import { Request , Response  } from "express";

import * as os from "os";

export const validationFileType = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/mpeg", "video/ogg", "video/webm"],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/webm",
    "audio/aac",
  ],
  file: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};


export enum storageEnum  {
  local ="local",
  cloud ="cloud"

};


export const MulterCloud = ({ fileTypes = validationFileType.image , storageType = storageEnum.cloud }: { fileTypes?: string[]  , storageType?:storageEnum}) => {
  const storage = storageType ===storageEnum.cloud ? multer.memoryStorage() :multer.diskStorage({
    destination:os.tmpdir,
    filename(req:Request,  file: Express.Multer.File, cb){

      cb(null , `${uuidv4}`)
    }
    
  });
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (fileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      return cb(new AppError("invalid type"));
    }
  };
  const upload = multer({ fileFilter,limits:{fileSize :1024*1024*5}, storage });
  return upload;
};
