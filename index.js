process.removeAllListeners('warning');

const { Contract, utils, BigNumber, ethers } = require("ethers")
const { parseEther } = require("@ethersproject/units");
const sleep = require("util").promisify(setTimeout);

const { 
  getClaimableEpochs,
  getSignals,  
  getUserData,
  percentage,
  getStats,
  predictionContract,
  getBNBPrice,
  checkBalance,
  reduceWaitingTimeByTwoBlocks,
  saveRound,
} = require('./helpers');

const {
  TradingViewScan,
  SCREENERS_ENUM,
  EXCHANGES_ENUM,
  INTERVALS_ENUM,
} = require('trading-view-recommends-parser-nodejs');

  //Global Config
  const GLOBAL_CONFIG = {
  BET_AMOUNT: 1, //Bet in USD
  STOP_LOSS: 1, //Stop Loss in USD, If the Balance is $1 or less the Bot is Stopped
  DAILY_GOAL: 50, //In USD, Daily Goal in BNB
  WAITING_TIME: 270000, 
  THRESHOLD: 54, //% Mandatory For the Bot (60 - 100), The Bot must comply that the % of Raise or Fall is greater than the % that we configure, otherwise that both Raise / Fall is less than the % configured then no bet is made
  ESTRATEGIAUSE: 'Standar', //Standar, Avanzada
  };

//Bet UP
const betUp = async (amount, epoch) => {
  try {

    const tx = await predictionContract.betBull(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });

    await tx.wait();
  
  console.log(`
  🤞 Successful bet of ${amount} BNB to UP[UP] 🍀
  ===============================================================
  `);

  } catch (error) {
    
  console.error(`
  transaction error 
  `);

    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
};

//Bet DOWN
const betDown = async (amount, epoch) => {

  try {
    const tx = await predictionContract.betBear(epoch, {
      value: parseEther(amount.toFixed(18).toString()),
    });
    await tx.wait();
  
  console.log(`
  🤞 Successful bet of ${amount} BNB to DOWN[DOWN] 🍁
  ===============================================================
  `);

  } catch (error) {
  
  console.error(`
  transaction error
  `);

    GLOBAL_CONFIG.WAITING_TIME = reduceWaitingTimeByTwoBlocks(
      GLOBAL_CONFIG.WAITING_TIME
    );
  }
};


//Claim
const claimMoney = async (epoch,walletAddress) => {
  
  let claimableEpochs = await getClaimableEpochs(predictionContract,epoch,walletAddress);

  const gasPrice = 5000000000 //5 Gwei
  const gasLimit = 93000 //93000
                            
  const optionsGas = {
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  }

  try {

  const tx = await predictionContract.claim(claimableEpochs,optionsGas); 
  await tx.wait();

  console.log(`
  💰 Successful Claim #${epoch.toString()}
  ===============================================================
  `);

  } catch (error){
  
  console.error(`
  💰 Claim Error #${epoch.toString()}
  `);

  }

};

const strategy = async (minAcurracy, epoch) => {

  let BNBPrice = await getBNBPrice();
  let getWalletUserData = await getUserData();

  let walletUser = getWalletUserData.wallet; 
  let balanceWallet = getWalletUserData.saldo;
  let stopLossUser = GLOBAL_CONFIG.STOP_LOSS / BNBPrice;

  let earnings = await getStats();

  await sleep(15000); //Wait 15 Seconds

  let dataRond = await predictionContract.functions.rounds(epoch); 
  let bullTotalRond = dataRond.bullAmount;
  let bearTotalRond = dataRond.bearAmount;

  console.error(`
  ===============================================================
  UP [${utils.formatUnits(bullTotalRond, '18')} BNB] | DOWN [${utils.formatUnits(bearTotalRond,'18')} BNB]
  ===============================================================
  `);
  
  if(earnings.profit_USD >= GLOBAL_CONFIG.DAILY_GOAL){
  console.log(`
  ===============================================================
  🧞 Daily goal achieved. Turning off... ✨ 
  ===============================================================
  `);
    process.exit();
  }

  //Stop Loss >> Stop If Balance in BNB is Equal to or Less than Stop Loss Set in USD
  //if(balanceWallet <= parseFloat(stopLossUser)){
  //console.error(`
  //===============================================================
 // 🧞 STOP LOSS!! $${GLOBAL_CONFIG.STOP_LOSS}[${parseFloat(stopLossUser)} BNB]. Shutting Down Bot To Avoid Losses...
  //===============================================================
  //`);
    //process.exit();
  //}
  //Stop Loss >> Stop If Balance in BNB is Equal to or Less than Stop Loss Set in USD

  let signals = await getSignals();

  if(signals){ 

  if (GLOBAL_CONFIG.ESTRATEGIAUSE == 'Standar' && signals.buy > signals.sell && percentage(signals.buy, signals.sell) > minAcurracy){

  console.log(`
  ===============================================================
  Strategy[Standard] Round #${epoch.toString()} 🔮 Prediction: UP[UP] 🟢 ${percentage(signals.buy, signals.sell)}% :: Bet Started
  `);
      
      await betUp(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      
      //Save Rond
      await saveRound(epoch.toString(), [ 
        { 
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bull",
        },
      ]);

    }else if(GLOBAL_CONFIG.ESTRATEGIAUSE == 'Standar' && signals.sell > signals.buy && percentage(signals.sell, signals.buy) > minAcurracy){

  console.log(`
  ===============================================================
  Strategy[Standard] Round #${epoch.toString()} 🔮 Prediction: DOWN[DOWN] 🔴 ${percentage(signals.sell, signals.buy)}% :: Bet Started
  `);

      await betDown(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      
      //Save Rond
      await saveRound(epoch.toString(), [
        {
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bear",
        },
      ]);

    }else if(GLOBAL_CONFIG.ESTRATEGIAUSE == 'Avanzada' && bullTotalRond > bearTotalRond && signals.buy > signals.sell && percentage(signals.buy, signals.sell) > minAcurracy){
 
  console.log(`
  ===============================================================
  Strategy[Advanced] Round #${epoch.toString()} 🔮 Prediction: UP[UP] 🟢 ${percentage(signals.buy, signals.sell)}% :: Bet Started
  `);

    await betUp(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch); 
      
      //Save Rond
      await saveRound(epoch.toString(), [ 
        { 
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bull",
        },
      ]);

    }else if(GLOBAL_CONFIG.ESTRATEGIAUSE == 'Avanzada' && bearTotalRond > bullTotalRond && signals.sell > signals.buy && percentage(signals.sell, signals.buy) > minAcurracy){

  console.log(`
  ===============================================================
  Strategy[Advanced] Round #${epoch.toString()} 🔮 Prediction: DOWN[DOWN] 🔴 ${percentage(signals.sell, signals.buy)}% :: Bet Started
  `);

    await betDown(GLOBAL_CONFIG.BET_AMOUNT / BNBPrice, epoch);
      
      //Save Rond
      await saveRound(epoch.toString(), [
        {
          round: epoch.toString(),
          betAmount: (GLOBAL_CONFIG.BET_AMOUNT / BNBPrice).toString(),
          bet: "bear",
        },
      ]);

    }else {

      let lowPercentage;
      let lowPercentageValue;
      if(signals.buy > signals.sell){
        lowPercentage = percentage(signals.buy, signals.sell);
        lowPercentageValue = 'UP[UP] 🟢';
      }else {
        lowPercentage = percentage(signals.sell, signals.buy);
        lowPercentageValue = 'DOWN[DOWN] 🔴';
      }

  console.log(`
  ===============================================================
  Waiting for the next round🕑 ${lowPercentageValue} ${lowPercentage} %
  ===============================================================
  `);

    }
  //Iniciamos Analisis de Apuesta

  }else{ //No Obtuvimos Señales
    console.log(`Failed to get signals`);
  }

};

//Welcome >>
console.log(`🤗 Welcome! waiting for the next round...`);
checkBalance(GLOBAL_CONFIG.BET_AMOUNT);

//Betting >>
predictionContract.on('StartRound', async (epoch) => {

  console.log(`
  ===============================================================
  🥞 Round for the Bet ${epoch.toString()}
  🕑 Waiting for ${(GLOBAL_CONFIG.WAITING_TIME / 60000).toFixed(1)} minutes to start bet.
  ===============================================================
  `);

  await sleep(GLOBAL_CONFIG.WAITING_TIME);
  await strategy(GLOBAL_CONFIG.THRESHOLD, epoch);

});
//Betting >>

//Show stats >>
predictionContract.on('EndRound', async (epoch) => {

  let getWalletUserData = await getUserData();
  let userWalletGetClaim = getWalletUserData.wallet;

  await saveRound(epoch.toString());
  let stats = await getStats();

  let claimableEpochs = await predictionContract.claimable(epoch, userWalletGetClaim);
  if(claimableEpochs){
  claimMoney(epoch,userWalletGetClaim);
  }

  console.log(`
  ===============================================================
  --------------- Stats #${epoch.toString()}-----------------
  🍀 Fortune: ${stats.percentage}
  👍 ${stats.win}|${stats.loss} 👎
  💰 Profit: ${stats.profit_USD.toFixed(3)} USD
  --------------- Stats -----------------
  ===============================================================
  `);

});
//Show stats >>