/*
    E2E testing

 */


require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | integration-test | "
//@ts-ignore
import { getPaths } from '@pioneer-platform/pioneer-coins';
import { WalletOption, availableChainsByWallet, Chain } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

let BLOCKCHAIN = ChainToNetworkId['BCH']
let ASSET = 'BCH'
let MIN_BALANCE = process.env['MIN_BALANCE_BCH'] || "0.004"
let TEST_AMOUNT = process.env['TEST_AMOUNT'] || "0.0001"
let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
let wss = process.env['URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'
let FAUCET_BCH_ADDRESS = process.env['FAUCET_BCH_ADDRESS']
if(!FAUCET_BCH_ADDRESS) throw Error("Need Faucet Address!")
let FAUCET_ADDRESS = FAUCET_BCH_ADDRESS


console.log("spec: ",spec)
console.log("wss: ",wss)

let txid:string
let IS_SIGNED: boolean


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //(tag,' CHECKPOINT 1');
        console.time('start2paired');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');
        //if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        // const queryKey = "key:66fefdd6-7ea9-48cf-8e69-fc74afb9c45412"
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        let blockchains = [BLOCKCHAIN]

        //get paths for wallet
        let paths = getPaths(blockchains)
        log.info("paths: ",paths.length)

        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            wss,
            paths,
            blockchains,
            // @ts-ignore
            ethplorerApiKey:
            // @ts-ignore
              process.env.VITE_ETHPLORER_API_KEY || 'EK-xs8Hj-qG4HbLY-LoAu7',
            // @ts-ignore
            covalentApiKey:
            // @ts-ignore
              process.env.VITE__COVALENT_API_KEY || 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q',
            // @ts-ignore
            utxoApiKey: process.env.VITE_BLOCKCHAIR_API_KEY || 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2',
            // @ts-ignore
            walletConnectProjectId:
            // @ts-ignore
              process.env.VITE_WALLET_CONNECT_PROJECT_ID || '18224df5f72924a5f6b3569fbd56ae16',
        };

        //console.log(tag,' CHECKPOINT 2');
        console.log(tag,' config: ',config);
        let app = new SDK.SDK(spec,config)
        const walletsVerbose: any = [];
        const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");
        //log.info(tag,"walletKeepKey: ",keepkeyWallet)
        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };
        walletsVerbose.push(walletKeepKey);

        let resultInit = await app.init(walletsVerbose, {})
        log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)





        let pairObject = {
            type:WalletOption.KEEPKEY,
            blockchains
        }
        resultInit = await app.pairWallet(pairObject)

        log.info(tag,"resultInit: ",resultInit)
        assert(app.keepkeyApiKey)
        if(!process.env.KEEPKEY_API_KEY || process.env.KEEPKEY_API_KEY !== app.keepkeyApiKey){
            log.alert("SET THIS IN YOUR ENV AS KEEPKEY_API_KEY: ",app.keepkeyApiKey)
        }

        //check pairing
        // //context should match first account
        let context = await app.context
        log.info(tag,"context: ",context)
        assert(context)

        // //get asset paths
        // let paths = app.paths
        // assert(paths)
        // assert(paths[0])
        // let assetPath = paths.filter((e:any) => e.symbol === ASSET)
        // log.info(tag,"assetPath: ",assetPath)
        // assert(assetPath)

        //
        await app.getPubkeys()
        // log.info(tag,"pubkeys: ",app.pubkeys)
        // assert(app.pubkeys)
        // assert(app.pubkeys[0])
        // let pubkey = app.pubkeys.filter((e:any) => e.symbol === ASSET)
        // log.info(tag,"pubkey: ",pubkey)
        // log.info(tag,"pubkey: ",pubkey.length)
        // assert(pubkey.length > 0)
        //verify pubkeys


        const pubkeysBtc = app.pubkeys.filter((e: any) => e.networks.includes(ChainToNetworkId[Chain.BitcoinCash]));
        const accounts = pubkeysBtc.map((pubkey: any) => pubkey.master || pubkey.address);
        log.info(tag,"accounts: ",accounts)
        let changeAddress = accounts[0]
        //TODO get new change address! no re-use
        assert(changeAddress)

        await app.getBalances()
        log.info(tag,"balances: ",app.balances)
        let balance = app.balances.filter((e:any) => e.symbol === ASSET)
        log.info(tag,"balance: ",balance)
        assert(balance.length > 0)
        //verify balances

        // create assetValue
        const assetString = `${ASSET}.${ASSET}`;
        console.log('assetString: ', assetString);
        await AssetValue.loadStaticAssets();
        log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        const assetValue = AssetValue.fromStringSync(assetString, parseFloat(TEST_AMOUNT));
        log.info("assetValue: ",assetValue)

        let pubkeys = await app.getPubkeys([BLOCKCHAIN])
        // let pubkeys = await app.getPubkeys()
        log.info("pubkeys: ",pubkeys)

        //send
        // let estimatePayload:any = {
        //     pubkeys,
        //     memo: '',
        //     recipient: FAUCET_ADDRESS,
        // }
        // log.info("app.swapKit: ",app.swapKit)
        // let maxSpendable = await app.swapKit.estimateMaxSendableAmount({chain:Chain.BitcoinCash, params:estimatePayload})
        // log.info("maxSpendable: ",maxSpendable)

        //send
        let sendPayload = {
            assetValue,
            from: changeAddress,
            // assetValue:maxSpendable,
            // isMax: true,
            memo: '',
            recipient: FAUCET_ADDRESS,
        }
        log.info("sendPayload: ",sendPayload)

        const wallet = await app.swapKit.getWallet(Chain.BitcoinCash);
        // log.info("wallet: ",wallet)

        //buildTx
        let unsignedTx = await wallet.buildTx(sendPayload)
        log.info("unsignedTx: ",unsignedTx)
        assert(unsignedTx)
        assert(unsignedTx.outputs)
        assert(unsignedTx.inputs)

        //reviewTx

        //add input

        //remove input

        //adjust output

        //adjust fee

        // signTransaction
        let signedTx = await wallet.signTransaction(unsignedTx.outputs, unsignedTx.inputs, unsignedTx.memo)
        log.info("signedTx: ",signedTx)

        //broadcastTx
        // let txid = await wallet.broadcastTx(signedTx)
        // log.info("txid: ",txid)

        // const txHash = await app.swapKit.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)

        log.info("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
