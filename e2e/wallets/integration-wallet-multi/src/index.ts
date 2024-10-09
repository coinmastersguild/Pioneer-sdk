/*
    E2E testing

 */

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, getChainEnumValue } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;
import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'

console.log("spec: ",spec)

const DB = require('@coinmasters/pioneer-db');
console.log("DB: ",DB)

let txid:string
let IS_SIGNED: boolean

const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //(tag,' CHECKPOINT 1');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');
        //if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        const txDB = new DB.DB({ });
        await txDB.init();

        const AllChainsSupported = availableChainsByWallet['KEEPKEY'];
        let blockchains = AllChainsSupported.map(
          // @ts-ignore
          (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );

        //get blockchains from cache
        // let enabledChains = await txDB.getEnabledChains()
        // //add to enabled

        //

        // let blockchains = [ChainToNetworkId['ETH']]
        log.info(tag,"blockchains: ",blockchains)
        let paths = getPaths(blockchains);
        assert(paths)
        log.info(tag,"paths: ",paths.length)

        let keepkeyApiKey = '3d49158f-ec95-489c-b8cd-61934d3fd3e2'

        let config:any = {
            appName: 'intergration-test-multi-wallet',
            appIcon: 'https://pioneers.dev/coins/pioneerMan.png',
            username,
            queryKey,
            blockchains,
            spec,
            keepkeyApiKey,
            paths,
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
        //console.log(tag,' config: ',config);
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
        console.time('start2init');
        let resultInit = await app.init(walletsVerbose, {})
        console.timeEnd('start2init');
        // log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)

        //pair wallet
        let pairObject = {
            type: WalletOption.KEEPKEY,
            blockchains,
        };
        resultInit = await app.pairWallet(pairObject);
        log.info(tag,"resultInit: ",resultInit)

        if (app.keepkeyApiKey !== keepkeyApiKey) {
            console.log('SAVING API KEY. ', app.keepkeyApiKey);
        }

        // console.log(app)
        // console.log(app.swapKit)
        // console.log('keepkeySdk:',app.keepKeySdk)
        let resultAssets = await app.getAssets()
        console.log('resultAssets:',resultAssets)

        let assetsMap = app.assetsMap
        log.info(tag,"assetsMap: ",assetsMap)

        //chainListInfo
        let chainListInfo = {
            "blockExplorerUrls": ["https://blastscan.io"],
            "chainId": "0x13e31", // Hex string for the chainId
            "chainName": "Blast",
            "nativeCurrency": {
                "name": "Ether",
                "symbol": "ETH",
                "decimals": 18
            },
            "rpcUrls": [
                "https://rpc.blast.io",
                "https://blast.din.dev/rpc",
                "https://blastl2-mainnet.public.blastapi.io"
            ]
        };
        let chainIdDecimal = parseInt(chainListInfo.chainId, 16);

        // setAssetContext
        let network = [
            {
                name: chainListInfo.chainName,
                networkId: 'eip155:' + chainIdDecimal, // Use decimal chainId for networkId
                caip: 'eip155:' + chainIdDecimal + "/slip44:60", // Correct caip format
                provider: chainListInfo.rpcUrls[0],
                providers: chainListInfo.rpcUrls, // All RPC URLs
                explorer: chainListInfo.blockExplorerUrls[0], // Explorer URL
                explorerAddressLink: chainListInfo.blockExplorerUrls[0] + "/address/", // Explorer address link
                explorerTxLink: chainListInfo.blockExplorerUrls[0] + "/tx/", // Explorer tx link
                symbol: chainListInfo.nativeCurrency.symbol, // Native currency symbol
                precision: chainListInfo.nativeCurrency.decimals // Currency precision
            }
        ];

        console.log(network[0])

        let result = await app.setAssetContext({caip:'eip155:1/slip44:60'})
        log.info(tag,"result: ",result)

        // let result = await app.setAssetContext(network[0])
        // log.info(tag,"result: ",result)

        console.log('assetContext: ',app.assetContext)



        // let txsCache = await txDB.getAllTransactions()
        // let pubkeysCache = await txDB.getPubkeys({})
        // let balancesCache = await txDB.getBalances({})
        // // log.info(tag,"txsCache: ",app.txsCache.length)
        // // log.info(tag,"pubkeysCache: ",app.pubkeysCache.length)
        // log.info(tag,"balancesCache: ",app.balancesCache)
        //
        // if(pubkeysCache.length == 0){
        //     log.info(tag,"DB empty: ",pubkeysCache)
        //     //add mm to pubkeys
        //     let pubkeysMM = [
        //           {"type":"address",
        //               "master":"0xe6F612699AA300d4C61571a101f726B4c59D0577",
        //               "address":"0xe6F612699AA300d4C61571a101f726B4c59D0577",
        //               "pubkey":"0xe6F612699AA300d4C61571a101f726B4c59D0577","context":"metamask:device.wallet","contextType":"metamask",
        //               "networks":["eip155:1","eip155:8453"]
        //           }
        //       ]
        //     let saved = await txDB.createPubkey(pubkeysMM[0])
        //     pubkeysCache = await txDB.getPubkeys({})
        // }
        // log.info(tag,"pubkeysCache: ",pubkeysCache)
        // assert(pubkeysCache)
        //
        // //load pubkeys
        // console.time('loadPubkeyCache');
        // await app.loadPubkeyCache(pubkeysCache)
        // console.timeEnd('loadPubkeyCache');
        //
        // //load balances
        // await app.loadBalanceCache(balancesCache)
        //
        // let pubkeys = app.pubkeys
        // log.info(tag,"app.pubkeys: ",pubkeys)
        // assert(pubkeys)
        // if(pubkeys.length == 0) throw Error("Failed to load pubkey cache")
        //
        //
        // // //connect
        // // assert(blockchains)
        // // assert(blockchains[0])
        //
        // // log.info(tag,"blockchains: ",blockchains.length)
        // console.time('start2paired');
        // let pairObject = {
        //     type:WalletOption.KEEPKEY,
        //     blockchains
        // }
        // console.time('pairWallet');
        // resultInit = await app.pairWallet(pairObject)
        // console.timeEnd('pairWallet');
        // console.timeEnd('start2paired'); // End timing for pairing
        // log.debug(tag,"resultInit: ",resultInit)
        //
        // //check pairing
        // // //context should match first account
        // let context = await app.context
        // log.info(tag,"context: ",context)
        // assert(context)
        //
        // log.info(tag,"assets: ",app.assets.length)
        // log.info(tag,"pubkeys: ",app.pubkeys.length)
        // log.info(tag,"balances: ",app.balances.length)
        //
        // // log.info(tag,"swapkit: ",app)
        // log.info(tag,"swapkit: ",app.swapKit)
        //
        // // console.time('start2getPubkeys');
        // // //init start2end: 9.129s
        // //
        // // //With getPubkeys
        // await app.getPubkeys()
        // console.timeEnd('start2getPubkeys');
        // log.info(tag,"***** pubkeys: ",app.pubkeys)
        // log.info(tag,"***** pubkeys: ",app.pubkeys.length)
        // // // assert(app.pubkeys)
        // // // assert(app.pubkeys[0])
        // // //if(app.pubkeys.length !== 2) throw Error("Failed to get ALL pubkeys")
        // // // let assetinfoIn = app.pubkeys.find((asset: { caip: any }) => asset.caip === ASSET_IN)
        // // // assert(assetinfoIn)
        // //
        // //
        // console.time('start2getBalances');
        // // await app.getBalances()
        // if(app.balances.length == 0){
        //     log.info("Getting balances manually!")
        //     await app.getBalances()
        // } else {
        //     log.info("Getting balances from cache!")
        // }
        // // log.info(tag,"balances: ",app.balances)
        // log.info(tag,"balances: ",app.balances.length)
        // console.timeEnd('start2getBalances');
        // // console.timeEnd('start2end');
        //
        // //update cache
        // for(let i = 0; i < app.balances.length; i++){
        //     let balance = app.balances[i]
        //     let saved = await txDB.createBalance(balance)
        //     log.info('saved: ',saved)
        // }

        //Pre OPT
        //start2end: 17.147s
        //start2end: 18.052s

        //Post OPT
        //start2end: 1.664s

        //query username by address
        // log.info("pubkeys: ",JSON.stringify(app.pubkeys))

        console.timeEnd('start2end');
        console.log("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
