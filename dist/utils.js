"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCsvAsList = exports.sendRequest = exports.randomPause = exports.sleep = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const util_1 = require("util");
const stream_1 = __importDefault(require("stream"));
const pipeline = (0, util_1.promisify)(stream_1.default.pipeline);
const sleep = (seconds) => {
    const milliseconds = seconds * 1000;
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};
exports.sleep = sleep;
const randomPause = () => {
    const minSeconds = Math.ceil(3);
    const maxSeconds = Math.floor(10);
    return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
};
exports.randomPause = randomPause;
const sendRequest = (url, urlConfig, timeout = 10000, maxRetries = 10) => __awaiter(void 0, void 0, void 0, function* () {
    let retries = 0;
    while (retries < maxRetries) {
        const source = axios_1.default.CancelToken.source();
        const timer = setTimeout(() => {
            source.cancel(`Request timed out after ${timeout} ms`);
        }, timeout);
        const newConfig = Object.assign(Object.assign({}, urlConfig), { url: url, timeout: timeout, cancelToken: source.token, method: urlConfig.method || 'get', onDownloadProgress: () => clearTimeout(timer) });
        try {
            const response = yield (0, axios_1.default)(newConfig);
            retries = maxRetries;
            return response.data;
        }
        catch (error) {
            console.error(error.message);
            retries++;
            console.log(`请求失败，开始重试第 ${retries} 次`);
        }
        finally {
            clearTimeout(timer);
        }
    }
    throw new Error(`Request failed after ${maxRetries} retries`);
});
exports.sendRequest = sendRequest;
const readCsvAsList = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    yield pipeline(fs_1.default.createReadStream(filePath), (0, csv_parser_1.default)({
        headers: false, // 确保csv-parser不期望第一行是标题行
        skipLines: 0, // 明确指定不跳过任何行（这是默认行为，此处仅为清晰说明）
    }), 
    // 使用Transform流来处理每一行CSV数据
    new stream_1.default.Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            // 假设每行只有一个数据项，且该项作为对象的一个属性存储
            // 我们需要知道这个属性的名称或者假设它是第一个属性
            const value = Object.values(chunk)[0];
            results.push(value);
            callback();
        }
    }));
    // 在这里处理你的结果
    console.log(results);
    return results;
});
exports.readCsvAsList = readCsvAsList;
