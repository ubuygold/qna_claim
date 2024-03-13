import axios from "axios"
import fs from "fs"
import csv from 'csv-parser';
import { promisify } from 'util';
import stream from 'stream';
const pipeline = promisify(stream.pipeline);

export const sleep = (seconds: number) => {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

export const randomPause = () => {
    const minSeconds = Math.ceil(3);
    const maxSeconds = Math.floor(10);
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
}

export const sendRequest = async (url: string, urlConfig: any, timeout = 10000, maxRetries = 10) => {
    let retries = 0;

    while (retries < maxRetries) {
        const source = axios.CancelToken.source();
        const timer = setTimeout(() => {
            source.cancel(`Request timed out after ${timeout} ms`);
        }, timeout);

        const newConfig = {
            ...urlConfig,
            url: url,
            timeout: timeout,
            cancelToken: source.token,
            method: urlConfig.method || 'get',
            onDownloadProgress: () => clearTimeout(timer),
        };

        try {
            const response = await axios(newConfig);
            retries = maxRetries;
            return response.data;
        }
        catch (error: any) {
            console.error(error.message);
            retries++;
            console.log(`请求失败，开始重试第 ${retries} 次`);

        } finally {
            clearTimeout(timer);
        }
    }

    throw new Error(`Request failed after ${maxRetries} retries`);
}

export const readCsvAsList = async (filePath: string) => {
    const results: string[] = [];

    await pipeline(
        fs.createReadStream(filePath),
        csv({
            headers: false, // 确保csv-parser不期望第一行是标题行
            skipLines: 0, // 明确指定不跳过任何行（这是默认行为，此处仅为清晰说明）
        }),
        // 使用Transform流来处理每一行CSV数据
        new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                // 假设每行只有一个数据项，且该项作为对象的一个属性存储
                // 我们需要知道这个属性的名称或者假设它是第一个属性
                const value = Object.values(chunk)[0];
                results.push(value as string);
                callback();
            }
        })
    );

    // 在这里处理你的结果
    console.log(results);
    return results
}
