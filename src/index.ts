import { ethers } from "ethers"
import fakeua from "fake-useragent"
import { sendRequest, readCsvAsList, sleep, randomPause } from "./utils"


const contractAddress = '0xB342e7D33b806544609370271A8D074313B7bc30'
const userAgent = fakeua()
const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/bsc")
// const username = 'user-lu8747455-region-sg';
// const password = 'ekgi77';
// const proxy = 'as.ft3ru1d0.lunaproxy.net:12233'

// const agent = new HttpsProxyAgent(
//     `http://${username}:${password}@${proxy}`
// );

// console.log(agent)

const headers: any = {
    'authority': 'api.qna3.ai',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7',
    'content-type': 'application/json',
    'origin': 'https://qna3.ai',
    'sec-ch-ua-platform': '"Windows"',
    'user-agent': userAgent,
    'x-lang': 'english',
};

function formHexData(string: string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be a string.');
    }

    if (string.length > 64) {
        throw new Error('String length exceeds 64 characters.');
    }

    return '0'.repeat(64 - string.length) + string;
}

function toBeHex(number: number) {
    if (typeof number !== 'number') {
        throw new Error('Input must be a number.');
    }
    return number.toString(16);
}

const login = async (wallet: ethers.Wallet) => {
    const url = 'https://api.qna3.ai/api/v2/auth/login?via=wallet';
    const msg = 'AI + DYOR = Ultimate Answer to Unlock Web3 Universe'
    const signature = await wallet.signMessage(msg);
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

    const resp = await sendRequest(url, urlConfig);
    headers['Authorization'] = `bearer ${resp.data.accessToken}`;
    return resp.data
}

const claim = async (wallet: ethers.Wallet) => {
    let url = 'https://api.qna3.ai/api/v2/my/claim-all';
    let claimData

    try {
        const data = {
            headers: headers,
            // httpsAgent: agent,
            // httpAgent: agent,
            method: 'post',
            data: {},
        };
        const response = await sendRequest(url, data);
        claimData = response.data;
        console.log(claimData)
    } catch (error) {
        console.log(error);
        return null;
    }

    const amountHex = formHexData(toBeHex(claimData.amount));
    const nonceHex = formHexData(toBeHex(claimData.signature.nonce));
    const signatureHex = claimData.signature.signature.slice(2);

    const transactionData = `0x624f82f5${amountHex}${nonceHex}00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000041${signatureHex}00000000000000000000000000000000000000000000000000000000000000`;

    const gasPrice = await wallet.provider.getGasPrice();
    const nonce = await wallet.getTransactionCount();
    const txToEstimate = {
        to: contractAddress,
        data: transactionData,
    };
    const gasLimit = await wallet.estimateGas(txToEstimate);
    const txData = {
        to: contractAddress,
        data: transactionData,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        nonce: nonce,
        value: 0,
    };

    const tx = await wallet.sendTransaction(txData);
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
}

const main = async () => {
    const addrList = await readCsvAsList("./privateKeys.csv")

    for (const pk of addrList) {
        const wallet = new ethers.Wallet(pk, provider)
        const loginInfo = await login(wallet)
        console.log(loginInfo)
        const claimReward = await claim(wallet)
        const sleepTime = randomPause()
        await sleep(sleepTime)
    }
}

main()
