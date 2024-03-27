import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1'
});

async function uploadFile(bucketName, file) {
    try {
        const random = Math.random().toString(36).substr(2, 25);
        const params = {
            Bucket: bucketName,
            Key: `${random}_${file.originalname}`,
            Body: file.buffer
        };
        const data = await s3.upload(params).promise();
        return data;
    } catch (err) {
        console.log(err);
        throw new Error("File can not be uploaded!");
    }
}

async function downloadFile(bucketName, filePath) {
    try {
        const params = {
            Bucket: bucketName,
            Key: filePath
        };
        const data = await s3.getObject(params).promise();
        return data;
    } catch (err) {
        console.log(err);
        throw new Error("File can not be downloaded!");
    }
}

async function deleteFile(bucketName, filePath) {
    try {
        const params = {
            Bucket: bucketName,
            Key: filePath
        };
        const data = await s3.deleteObject(params).promise();
        return data;
    } catch (err) {
        console.log(err);
        throw new Error("File can not be deleted!");
    }
}

export { s3, uploadFile, downloadFile, deleteFile };
