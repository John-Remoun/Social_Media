"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = exports.writePipeLine = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const config_1 = require("../../config/config");
const Enums_1 = require("../Enums");
const exceptions_1 = require("../exceptions");
exports.writePipeLine = (0, node_util_1.promisify)(node_stream_1.pipeline);
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.S3_REGION,
            credentials: {
                accessKeyId: config_1.S3_ACCESS_KEY_ID,
                secretAccessKey: config_1.S3_ACCESS_SECRET_KEY,
            },
        });
    }
    async uploadFile({ storageApproach = Enums_1.StorageApproachEnum.MEMORY, Bucket = config_1.S3_BUCKET_NAME, path = "general", ACL = client_s3_1.ObjectCannedACL.private, file, ContentType, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: storageApproach === Enums_1.StorageApproachEnum.MEMORY
                ? file.buffer
                : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || ContentType,
        });
        await this.client.send(command);
        if (!command.input.Key) {
            throw new exceptions_1.BadRequestException("Fail to upload this file");
        }
        return command.input.Key;
    }
    async uploadLargeFile({ storageApproach = Enums_1.StorageApproachEnum.DISK, Bucket = config_1.S3_BUCKET_NAME, path = "general", ACL = client_s3_1.ObjectCannedACL.private, file, ContentType, }) {
        const upload = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}_${file.originalname}`,
                ACL,
                Body: storageApproach === Enums_1.StorageApproachEnum.MEMORY
                    ? file.buffer
                    : (0, fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || ContentType,
            },
        });
        upload.on("httpUploadProgress", (progress) => {
            console.log(`Uploaded file progress: ${progress.loaded}/${progress.total} bytes`);
        });
        const result = await upload.done();
        if (!result.Key) {
            throw new exceptions_1.BadRequestException("Fail to upload large file");
        }
        return result.Key;
    }
    async uploadFiles({ storageApproach = Enums_1.StorageApproachEnum.MEMORY, uploadApproach = Enums_1.UploadApproachEnum.LARGE, Bucket = config_1.S3_BUCKET_NAME, path = "general", ACL = client_s3_1.ObjectCannedACL.private, files, }) {
        const uploadFn = uploadApproach === Enums_1.UploadApproachEnum.LARGE
            ? (file) => this.uploadLargeFile({ storageApproach, Bucket, path, ACL, file })
            : (file) => this.uploadFile({ storageApproach, Bucket, path, ACL, file });
        return Promise.all(files.map(uploadFn));
    }
    async getFile({ Bucket = config_1.S3_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.GetObjectCommand({ Bucket, Key });
        return this.client.send(command);
    }
    async listFiles({ Bucket = config_1.S3_BUCKET_NAME, folderKey, }) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: `${config_1.APPLICATION_NAME}/${folderKey}`,
        });
        const objectList = await this.client.send(command);
        return objectList;
    }
    async deleteFile({ Bucket = config_1.S3_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.DeleteObjectCommand({ Bucket, Key });
        return this.client.send(command);
    }
    async deleteFiles({ Bucket = config_1.S3_BUCKET_NAME, keysToDelete, Quiet = false, }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: keysToDelete.map((Key) => ({ Key })),
                Quiet,
            },
        });
        return this.client.send(command);
    }
    async deleteFolderContent({ Bucket = config_1.S3_BUCKET_NAME, Quiet = false, folderKey, }) {
        const objects = await this.listFiles({ Bucket, folderKey });
        if (!objects.Contents?.length) {
            throw new exceptions_1.BadRequestException(`No objects found under folder: ${folderKey}`);
        }
        const keysToDelete = objects.Contents.map((obj) => obj.Key);
        return this.deleteFiles({ Bucket, keysToDelete, Quiet });
    }
    async createPreSignedUploadLink({ expiresIn = config_1.S3_EXPIRES_IN, Bucket = config_1.S3_BUCKET_NAME, path = "general", ContentType, originalname, }) {
        const Key = `${config_1.APPLICATION_NAME}/${path}/${(0, crypto_1.randomUUID)()}_${originalname}`;
        const command = new client_s3_1.PutObjectCommand({ Bucket, Key, ContentType });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        return { url, Key };
    }
    async createPreSignedDownloadLink({ Bucket = config_1.S3_BUCKET_NAME, Key, expiresIn = 60, downloadName, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: `attachment; filename="${downloadName || Key.split("/").pop()}"`,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
