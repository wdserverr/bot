const Web3 = require('web3');
const chalk = require('chalk');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();


let web3;
let web3Ws;

const createWeb3 = async() => {
    try{
        web3 = new Web3(process.env.WSS_URL);
        web3Ws = new Web3(new Web3.providers.WebsocketProvider(process.env.WSS_URL));
        return true;
    }catch(err){
        console.log(JSON.stringify(err));
        return false;
    }
}

const myAccount = async (privateKey) => {
    try{
        return web3.eth.accounts.privateKeyToAccount(privateKey);
    }catch(err){
        console.log(err);
        return false;
    }
}

const checkBalance = async (address) => {
    let res = await axios.get(`https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.API_KEY}`);
    let balance = web3.utils.fromWei(res.data.result, 'ether');

    // console.log(chalk.cyan('= = = = = = = = = = = = = = = = = = = = = = = = = = ='));
    console.log(chalk.yellow(`balance : ${balance} BNB`));
    // console.log(chalk.cyan('= = = = = = = = = = = = = = = = = = = = = = = = = = ='));
    return res.data;
}

const run = async() => {
    let dataBalance, balance, amountSend, fee, minBalance, requiredGasPrice, currentGas;
    try{
        //check sender balance
        if (await createWeb3() === false){
            process.exit();
        }

        dataBalance = await checkBalance(process.env.ADDRESS_SENDER);
        balance = dataBalance.result;
        minBalance = web3.utils.toWei(process.env.MIN_AMOUNT, 'ether');
        currentGas = await web3.eth.getGasPrice();
        requiredGasPrice = await web3.eth.estimateGas({to: process.env.ADDRESS_RECEPIENT});
        fee = currentGas * requiredGasPrice;

        amountSend = balance - fee;

        if (amountSend >= parseInt(minBalance)){
            console.log(chalk.green(`Will send ${amountSend} to ${process.env.ADDRESS_RECEPIENT}`));
            return main();
        }else{
            console.log('RETRYING......');
        }
    }
    catch(err){
        console.log(JSON.stringify(err));
        process.exit();
    }
}

async function main() {
    const { RPC_URL, PRIVATE_KEY2, TO2, TO1, PRIVATE_KEY } = process.env;
  
    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL))
    const pubkey = await web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY2).address;
  
    const balance = await web3.eth.getBalance(pubkey)
    const currentGas = await web3.eth.getGasPrice();
    const requiredGasPrice = await web3.eth.estimateGas({to: TO1});
    const gas = currentGas * requiredGasPrice;
    const value = web3.utils.toWei("1", "ether");
    const nonce = await web3.eth.getTransactionCount(pubkey, 'latest');
  
    const transaction = {
        'to': TO1,
        'value': web3.utils.toHex(balance - gas),
        'gas': web3.utils.toHex(requiredGasPrice),
        'gasPrice': web3.utils.toHex(currentGas),
        'nonce': web3.utils.toHex(nonce)
    };    
  
    const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY2);
  
    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
        if (!error) {
            console.log("transaction is succes: ", "https://testnet.bscscan.com/tx/" + hash);
        } else {
            console.log("❗ Something went wrong while submitting your transaction: ")
        }
    });
  }

  
// setInterval(async () => {
//     await run();
// },process.env.INTERVAL * 1000);

async function execute1() {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      run();
    }
  }
  
  execute1();
