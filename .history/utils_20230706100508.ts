import {Buffer} from 'node:buffer';
import * as Token from 'token-types';
import {fromBuffer, EndOfStreamError} from 'strtok3';

export const isPdf = (buffer: Uint8Array, offset?: number) => {
    const headers = [0x25, 0x50, 0x44, 0x46];
    return headers.every((correct, index) => correct === buffer[index + (offset || 0)]);
}

export const isZip = (buffer: Uint8Array, offset?: number) => {
    const headers = [0x50, 0x4B, 0x3, 0x4];
    return headers.every((correct, index) => correct === buffer[index + (offset || 0)]);
}

export const isDocx = async (fileView: Uint8Array) => {
    if (!isZip(fileView)) {
        return false;
    }
    const buffer =  Buffer.alloc(4100);
    // 创建分词器，用于读取和查看分词器流（https://www.npmjs.com/package/strtok3#method-strtok3fromBuffer）
    const tokenizer = fromBuffer(fileView)
    try {
        // 循环读取每一个local header，每个local header占用30字节
        while (tokenizer.position + 30 < tokenizer.fileInfo.size!) {
            // 使用分词器读取local header到buffer中
            await tokenizer.readBuffer(buffer, {length: 30});
            const zipHeader = {
                compressedSize: buffer.readUInt32LE(18), // 文件压缩体积
                uncompressedSize: buffer.readUInt32LE(22), // 未压缩体积
                filenameLength: buffer.readUInt16LE(26), // 文件名称占用字节长度
                extraFieldLength: buffer.readUInt16LE(28), // 额外字段长度
                filename: ''
            }
            // 
            zipHeader.filename = await tokenizer.readToken(new Token.StringType(zipHeader.filenameLength, 'utf-8'));
			await tokenizer.ignore(zipHeader.extraFieldLength);
            if (zipHeader.filename.endsWith('.xml')) {
                const type = zipHeader.filename.split('/')[0];
                if (type === 'word') {
                    return true;
                }
            }
            // Try to find next header manually when current one is corrupted
            if (zipHeader.compressedSize === 0) {
                let nextHeaderIndex = -1;

                while (nextHeaderIndex < 0 && (tokenizer.position < tokenizer.fileInfo.size!)) {
                    await tokenizer.peekBuffer(buffer, {mayBeLess: true});

                    nextHeaderIndex = buffer.indexOf('504B0304', 0, 'hex');
                    // Move position to the next header if found, skip the whole buffer otherwise
                    await tokenizer.ignore(nextHeaderIndex >= 0 ? nextHeaderIndex : buffer.length);
                }
            } else {
                await tokenizer.ignore(zipHeader.compressedSize);
            }
        }
        return false;
    } catch (error) {
        if (!(error instanceof EndOfStreamError)) {
            throw error;
        }
    }
}