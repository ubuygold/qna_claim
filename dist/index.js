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
const ethers_1 = require("ethers");
const fake_useragent_1 = __importDefault(require("fake-useragent"));
const utils_1 = require("./utils");
const contractAddress = '0xB342e7D33b806544609370271A8D074313B7bc30';
const userAgent = (0, fake_useragent_1.default)();
const provider = new ethers_1.ethers.providers.JsonRpcProvider("https://rpc.ankr.com/bsc");
// const username = 'user-lu8747455-region-sg';
// const password = 'ekgi77';
// const proxy = 'as.ft3ru1d0.lunaproxy.net:12233'
// const agent = new HttpsProxyAgent(
//     `http://${username}:${password}@${proxy}`
// );
// console.log(agent)
const headers = {
    'authority': 'api.qna3.ai',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7',
    'content-type': 'application/json',
    'origin': 'https://qna3.ai',
    'sec-ch-ua-platform': '"Windows"',
    'user-agent': userAgent,
    'x-lang': 'english',
};
function formHexData(string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be a string.');
    }
    if (string.length > 64) {
        throw new Error('String length exceeds 64 characters.');
    }
    return '0'.repeat(64 - string.length) + string;
}
function toBeHex(number) {
    if (typeof number !== 'number') {
        throw new Error('Input must be a number.');
    }
    return number.toString(16);
}
const login = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    const url = 'https://api.qna3.ai/api/v2/auth/login?via=wallet';
    const msg = 'AI + DYOR = Ultimate Answer to Unlock Web3 Universe';
    const signature = yield wallet.signMessage(msg);
    console.log(`当前地址${wallet.address}已签名`);
    const data = {
        'wallet_address': wallet.address,
        'signature': signature,
        //'recaptcha': gRecaptchaResponse,
    };
    const urlConfig = {
        headers: headers,
        // httpsAgent: agent,
        // httpAgent: agent,
        method: 'post',
        data: data,
    };
    const resp = yield (0, utils_1.sendRequest)(url, urlConfig);
    headers['Authorization'] = `bearer ${resp.data.accessToken}`;
    return resp.data;
});
const claim = (wallet) => __awaiter(void 0, void 0, void 0, function* () {
    let url = 'https://api.qna3.ai/api/v2/my/claim-all';
    let claimData;
    try {
        const data = {
            headers: headers,
            // httpsAgent: agent,
            // httpAgent: agent,
            method: 'post',
            data: {},
        };
        const response = yield (0, utils_1.sendRequest)(url, data);
        claimData = response.data;
        console.log(claimData);
    }
    catch (error) {
        console.log(error);
        return null;
    }
    const amountHex = formHexData(toBeHex(claimData.amount));
    const nonceHex = formHexData(toBeHex(claimData.signature.nonce));
    const signatureHex = claimData.signature.signature.slice(2);
    const transactionData = `0x624f82f5${amountHex}${nonceHex}00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000041${signatureHex}00000000000000000000000000000000000000000000000000000000000000`;
    const gasPrice = yield wallet.provider.getGasPrice();
    const nonce = yield wallet.getTransactionCount();
    const txToEstimate = {
        to: contractAddress,
        data: transactionData,
    };
    const gasLimit = yield wallet.estimateGas(txToEstimate);
    const txData = {
        to: contractAddress,
        data: transactionData,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        nonce: nonce,
        value: 0,
    };
    const tx = yield wallet.sendTransaction(txData);
    console.log('领取tx：', tx.hash);
    //     url = `https://api.qna3.ai/api/v2/my/claim/${claimData.history_id}`;
    //     const data = {
    //         "hash": tx.hash,
    //     };
    //     const urlConfig = {
    //         headers: headers,
    //         // httpsAgent: agent,
    //         // httpAgent: agent,
    //         method: 'post',
    //         data: data,
    //     };
    //     const response = await sendRequest(url, urlConfig);
    //     const responseData = response.data;
    //     return responseData;
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const addrList = yield (0, utils_1.readCsvAsList)("./privateKeys.csv");
    for (const pk of addrList) {
        const wallet = new ethers_1.ethers.Wallet(pk, provider);
        const loginInfo = yield login(wallet);
        console.log(loginInfo);
        const claimReward = yield claim(wallet);
        const sleepTime = (0, utils_1.randomPause)();
        yield (0, utils_1.sleep)(sleepTime);
    }
});
main();
