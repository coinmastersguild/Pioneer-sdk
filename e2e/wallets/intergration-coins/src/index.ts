/*
    E2E testing

       This an e2e testing framework targeting node.js containers

       it is the equivalent of the pioneer-react file for a web browser.

       it is the building blocks of a pioneer-cli that run perform transfers as a "skill"
 */

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, getChainEnumValue, NetworkIdToChain, Chain } from '@coinmasters/types';
//@ts-ignore
import { AssetValue } from '@pioneer-platform/helpers';
import type { AssetValue as AssetValueType } from '@pioneer-platform/helpers';
// import { AssetValue as AssetValueType } from '@coinmasters/core';

const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId, shortListSymbolToCaip} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;
import {
    getPaths,
    addressNListToBIP32,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ",spec)



let txid:string
let IS_SIGNED: boolean



const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        const txDB = new DB.DB({ });
        await txDB.init();

        //(tag,' CHECKPOINT 1');
        console.time('start2init');
        console.time('start2pair');
        console.time('start2Pubkeys');
        console.time('start2BalancesGas');
        console.time('start2BalancesTokens');
        console.time('start2end');

        // if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        //TODO test enabled blockchain cacheing
        // const AllChainsSupported = availableChainsByWallet['KEEPKEY'];
        // assert(AllChainsSupported)
        // log.info(tag,"AllChainsSupported: ",AllChainsSupported)

        let AllChainsSupported = [
            'ETH',
            // 'ARB',
            // 'OP',  //Fast
            // 'MATIC', //SLOW charting
            // 'AVAX', //fast
            // 'BASE', //fast
            // 'BSC', //fast
            // 'BTC',
            // 'BCH',
            // 'GAIA',
            // 'OSMO',
            // 'XRP',
            // 'DOGE',
            // 'DASH',
            // 'MAYA',
            // 'LTC',
            // 'THOR'
        ]

        let pubkeysCache = await txDB.getPubkeys()
        log.info("pubkeysCache: ",pubkeysCache.length)

        //get balances cache
        let balancesCache = await txDB.getBalances()
        log.info("balancesCache: ",balancesCache.length)

        // const AllChainsSupported = [Chain.Base];
        // const AllChainsSupported = [Chain.Ethereum, Chain.Base];
        // const AllChainsSupported = [Chain.Ethereum, Chain.Base, Chain.BitcoinCash];
        let blockchains = AllChainsSupported.map(
          // @ts-ignore
          (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );
        log.info(tag,"blockchains: ",blockchains)
        log.info(tag,"blockchains: ",blockchains.length)
        //add custom path
        // let blockchains = [BLOCKCHAIN]
        // let paths:any = []
        let paths = getPaths(blockchains)
        log.info(tag,"paths: ",paths.length)
        assert(paths)

        //add custom btc paths
        //add account 0 p2sh segwit
        if(blockchains.includes('bip122:000000000019d6689c085ae165831e93')){
            paths.push({
                note:"Bitcoin account 0 segwit (p2sh)",
                networks: ['bip122:000000000019d6689c085ae165831e93'],
                script_type:"p2sh-p2wpkh",
                available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
                type:"ypub",
                addressNList: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0],
                addressNListMaster: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
                curve: 'secp256k1',
                showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            })
            paths.push({
                note:"Bitcoin account 1 Native Segwit (Bech32)",
                blockchain: 'bitcoin',
                symbol: 'BTC',
                symbolSwapKit: 'BTC',
                networks: ['bip122:000000000019d6689c085ae165831e93'],
                script_type:"p2wpkh", //bech32
                available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
                type:"zpub",
                addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
                addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
                curve: 'secp256k1',
                showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
            })
        }

        for(let i = 0; i < paths.length; i++){
            let path = paths[i]
            log.info(tag,"path: ",path)
            assert(path.networks)
        }

        for(let i = 0; i < pubkeysCache.length; i++){
            let pubkey = pubkeysCache[i]
            log.info(tag,"pubkey: ",pubkey)
            assert(pubkey.pubkey)
            assert(pubkey.type)
            assert(pubkey.path)
        }


        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            paths,
            blockchains,
            pubkeys:pubkeysCache,
            balances:balancesCache,
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
        log.info(tag,"walletKeepKey: ",keepkeyWallet)
        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };
        walletsVerbose.push(walletKeepKey);
        // console.time('start2init');
        let resultInit = await app.init(walletsVerbose, {})
        // log.info(tag,"resultInit: ",resultInit)
        console.timeEnd('start2init');

        /*
            Adding asset to pioneerSDK in real time

            1. needs a caip!
            //check local
            //check remote by caip

            build asset
            icon:
            symbol:
            name:
            decimals:
            chain:
            networkId:
         */
        //add a custom asset (token)
        //let asset =
        //add a custom blockchain

        //add a custom asset (gas token)

        let assets = await app.assetsMap
        // log.info(tag,"assets: START: ",assets)
        assert(assets)
        for(let i = 0; i < blockchains.length; i++){
            let blockchain = blockchains[i]
            log.info('blockchain: ',blockchain)
            let chain = NetworkIdToChain[blockchain]
            assert(chain)
            log.info('chain: ',chain)
            let caip = shortListSymbolToCaip[chain]
            log.info('caip: ',caip)
            assert(caip)
            assert(assets.get(caip))
        }
        //verify 1 asset per chain
        log.info(tag,"assets: END: ",assets)

        // console.time('start2paired');
        let pairObject = {
            type:WalletOption.KEEPKEY,
            blockchains,
        }
        let resultPair = await app.pairWallet(pairObject)
        log.info(tag,"resultPair: ",resultPair)
        console.timeEnd('start2pair');

        let assets2 = await app.assetsMap
        assert(assets2)

        // log.info(tag,"assets2: ",assets2)

        //get balances from cache

        //filter balances for networkId
        // let balancesCache = balances1.filter((balance:any) => balance.networkId === NetworkId.ETH)
        log.info("pubkeysCache: ",pubkeysCache.length)
        log.info("app.pubkeys.length: ",app.pubkeys.length)

        //find missing pubkeys
        let incomplete = false
        for(let i = 0; i < app.paths.length; i++){
            let path = app.paths[i]
            let pubkey = app.pubkeys.find((pubkey:any) => pubkey.path === path.path)
           if(!pubkey){
               incomplete = true
               break
           }
        }

        //only query on missing pubkeys
        if(incomplete){
            log.info(tag,"No pubkeys found, recalculating...")
            let pubkeys = await app.getPubkeys()
            assert(pubkeys)
            assert(pubkeys[0])
            assert(app.pubkeys)
            assert(app.pubkeys[0])
            log.info(tag,"pubkeys: ",pubkeys)
            log.info(tag,"app.pubkeys: ",app.pubkeys)
            for(let i = 0; i < pubkeys.length; i++){
                let pubkey = pubkeys[i]
                log.info(tag,"pubkey: ",pubkey)
                assert(pubkey)
                assert(pubkey.pubkey)
                try{
                    log.info(tag,'saving pubkey: ',pubkey)
                    txDB.createPubkey(pubkey)
                }catch(e){
                    console.error('Already saved pubkey: '+pubkey.pubkey)
                }
            }
        }

        log.info(tag,'app.paths: ',app.paths.length)
        log.info(tag,'app.pubkeys: ',app.pubkeys.length)
        // if(app.pubkeys.length !== app.paths.length) throw Error('Missing pubkeys! failed to sync')

        for(let i = 0; i < paths.length; i++){
            let path = paths[i]
            log.info(tag,' path: ',path)
            log.info(tag,' path: ',addressNListToBIP32(path.addressNList))
            let pubkey = app.pubkeys.find((pubkey:any) => pubkey.path === addressNListToBIP32(path.addressNList))
            assert(pubkey)
        }


        //validate pubkeys
        for(let i = 0; i < app.pubkeys.length; i++){
            let pubkey = app.pubkeys[i]
            log.info(tag,"pubkey: ",pubkey)
            assert(pubkey)
            assert(pubkey.pubkey)
            assert(pubkey.type)
        }

        console.timeEnd('start2Pubkeys');

        log.info(tag,'app.paths: ',app.paths.length)
        log.info(tag,'app.pubkeys: ',app.pubkeys.length)
        // if(app.pubkeys.length !== app.paths.length) throw Error('Missing pubkeys! failed to sync')

        //
        paths.push({
            note:"Bitcoin account 2 Native Segwit (Bech32)",
            blockchain: 'bitcoin',
            symbol: 'BTC',
            symbolSwapKit: 'BTC',
            network: 'bip122:000000000019d6689c085ae165831e93',
            script_type:"p2wpkh", //bech32
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"zpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 2],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 2, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        //



        /*
            If you have an expired balance, you need to recalculate the balance
         */
        // log.info("balanceCache: ", balancesCache.length);
        // log.info("app.balances.length: ", app.balances.length);
        // //find expired balances > 1 hour
        // //find enabled charts, find cached charts
        // //is missing perform chart query
        // if (!app.balances || app.balances.length === 0) {
        //     log.info(tag, "No balances found, recalculating...");
        //
        //     let balances = await app.getBalances();
        //     // log.info(tag, "balances: ", balances)
        //     log.info(tag, "balances: ", balances.length)
        //     log.info(tag, "balances: ", balances[0])
        //     let chartData = await app.getCharts();
        //     log.info(tag, "chartData: ", chartData.length)
        //     log.info(tag, "chartData: ", chartData[0])
        //     balances = [...balances, ...chartData];
        //     log.info(tag, "balances: ", balances);
        //     log.info(tag, "balances: TOTAL: ", balances.length);
        //     assert(balances);
        //     assert(balances[0]);
        //     assert(app.balances);
        //     assert(app.balances[0]);
        //     log.info(tag, "balances: ", app.balances);
        //
        //     for (let i = 0; i < balances.length; i++) {
        //         let balance = balances[i];
        //         log.info(tag, "*** balance: ", balance);
        //         assert(balance);
        //         assert(balance.caip);
        //         txDB.createBalance(balance);
        //     }
        // }
        // console.timeEnd('start2BalancesGas');
        //
        // // Verify gas balances for each enabled chain
        // for (let i = 0; i < blockchains.length; i++) {
        //     let blockchain = blockchains[i];
        //     let chain = NetworkIdToChain[blockchain];
        //     assert(chain);
        //     let caip = shortListSymbolToCaip[chain];
        //     assert(caip);
        //     log.info(tag, "caip: ", caip);
        //     let balance = app.balances.find((balance: any) => balance.caip === caip);
        //     assert(balance);
        //     assert(balance.caip);
        //     log.info(tag, balance.caip + " USD: ", balance.valueUsd);
        // }
        //
        // // Portfolio breakdown by tokens, nfts, and gas assets
        // let portfolio: any = {
        //     tokens: [],
        //     nfts: [],
        //     gasAssets: []
        // };
        //
        // for (let i = 0; i < app.balances.length; i++) {
        //     let balance: any = app.balances[i];
        //     if (balance.type === 'nft') {
        //         portfolio.nfts.push(balance);
        //     } else if (balance.type === 'Native') {
        //         portfolio.gasAssets.push(balance);
        //     } else {
        //         portfolio.tokens.push(balance);
        //     }
        // }
        //
        // log.info(tag, " ** Portfolio Breakdown: ** tokens: ", portfolio.tokens.length);
        // log.info(tag, " ** Portfolio Breakdown: ** nfts: ", portfolio.nfts.length);
        // log.info(tag, " ** Portfolio Breakdown: ** gasAssets: ", portfolio.gasAssets.length);
        //
        // let portfolioValue = 0;
        // for (let i = 0; i < app.balances.length; i++) {
        //     let balance: any = app.balances[i];
        //     assert(balance);
        //     assert(balance.networkId);
        //     assert(balance.caip);
        //     log.info(tag, balance.caip + " USD: ", balance.valueUsd);
        //     portfolioValue += parseFloat(balance.valueUsd);
        // }
        // log.info(tag, "portfolioValue: ", portfolioValue);


        log.info(tag,'APP: ',app)
        log.info(tag,'APP: ',app.swapKit)
        log.info(tag,'APP: ',await app.swapKit.getWallet(Chain.Ethereum))


        //for each blockchain get token protocals

        //get chart of protocol per chain

        //get token balances

        //recalculate portfolio value

        //ok on swap in select assets, we want onlyOwned
        // let filterForMemoless = {
        //     hasPubkey: true,
        //     onlyOwned: true,
        //     noTokens: false,
        //     // searchQuery:"",
        //     // memoless: true,
        //     // integrations: [],
        // }
        // let assetsFiltered = await app.getAssets(filterForMemoless)
        // log.info(tag,"assetsFiltered: (swapin)",assetsFiltered.length)
        // log.info(tag,"assetsFiltered: (swapin)",assetsFiltered)

        //swap out we want everything including tokens, BUT filter by memoless AND trading pairs.
        //if no trading pairs, then smart route with a pivot asset

        // let filterForOutput = {
        //     hasPubkey: false,
        //     onlyOwned: false,
        //     noTokens: false,
        //     // searchQuery:"",
        //     memoless: true,
        //     integrations: ['rango', 'uniswap'],
        // }
        // let assetsFiltered = await app.getAssets(filterForOutput)
        // log.info(tag,"assetsFiltered: (swapin)",assetsFiltered.length)
        // log.info(tag,"assetsFiltered: (swapin)",assetsFiltered)


        //filter by memoless
        // let filterForMemoless = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:false,
        //     // searchQuery:"",
        //     memoless:true,
        //     // integrations: [],
        // }
        // let assetsFiltered = await app.getAssets(filterForMemoless)
        // log.info(tag,"assetsFiltered: (memoless)",assetsFiltered.length)

        // let filterForNoTokens = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:true,
        //     // searchQuery:"",
        //     // memoless:true,
        //     // integrations: [],
        // }
        // let assetsFiltered2 = await app.getAssets(filterForNoTokens)
        // log.info(tag,"assetsFiltered: (no tokens)",assetsFiltered2.length)

        // let filterForBitcoin = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:true,
        //     searchQuery:"Bitcoin",
        //     // memoless:true,
        //     // integrations: [],
        //     // networks: []
        // }
        // let assetsFilteredSearch = await app.getAssets(filterForBitcoin)
        // log.info(tag,"assetsFiltered: (search bitcoin)",assetsFilteredSearch.length)
        //
        // let filterForThorswap = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:false,
        //     // searchQuery:"",
        //     // memoless:true,
        //     integrations: ['thorswap'],
        //     // networks: []
        // }
        // let assetsFiltered3 = await app.getAssets(filterForThorswap)
        // log.info(tag,"assetsFiltered: (thorswap)",assetsFiltered3.length)

        // let filterForBase = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:false,
        //     // searchQuery:"",
        //     // memoless:true,
        //     // integrations: ['thorswap'],
        //     networks: ['eip155:8453']
        // }
        // let assetsFiltered4 = await app.getAssets(filterForBase)
        // log.info(tag,"assetsFiltered: (base)",assetsFiltered4.length)

        // let filterForEth = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:false,
        //     // searchQuery:"",
        //     // memoless:true,
        //     // integrations: ['thorswap'],
        //     networks: ['eip155:1']
        // }
        // let assetsFiltered5 = await app.getAssets(filterForEth)
        // log.info(tag,"assetsFiltered: (eth)",assetsFiltered5.length)


        // //filter by base blockchain
        // log.info(tag,"assets: ",assets)

        // const baseNetworkId = 'eip155:8453';
        // const filteredAssets2 = assets.filter((asset: any) => {
        //     // Check if asset belongs to BASE blockchain by networkId
        //     const isBaseAsset = asset.networkId === baseNetworkId;
        //
        //     // Additional conditions can be included if needed, e.g., onlyOwned, noTokens, etc.
        //     // For simplicity, this example focuses on filtering by BASE networkId
        //     return isBaseAsset;
        // });
        // log.info(tag,"filteredAssets: ",filteredAssets2)
        //
        // let onlyOwned = true
        // let noTokens = false
        // let hasPubkey = true
        // let searchQuery = ""
        // const filteredAssets = assets.filter((asset: any) => {
        //     // Ensure asset.name and searchQuery are both strings before calling toLowerCase()
        //     const assetName = asset.name ? asset.name.toLowerCase() : '';
        //     const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase() : '';
        //
        //     return assetName.includes(normalizedSearchQuery) &&
        //       (!onlyOwned || (onlyOwned && asset.balance && parseFloat(asset.balance) > 0)) &&
        //       (!noTokens || (noTokens && asset.type !== 'token')) &&
        //       (!hasPubkey || (hasPubkey && asset.pubkey));
        // });
        // log.info('filteredAssets: ',filteredAssets.length)
        // log.info('filteredAssets: ',filteredAssets[0])
        // log.info('filteredAssets: ',filteredAssets)


        // const AllChainsSupported = availableChainsByWallet['KEEPKEY'];
        // const AllChainsSupported = [Chain.Ethereum, Chain.Base, Chain.BitcoinCash];
        // let blockchains = AllChainsSupported.map(
        //   // @ts-ignore
        //   (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        // );
        //
        // //get paths for wallet
        // let paths = getPaths(blockchains)
        // log.info("paths: ",paths.length)
        // // @ts-ignore
        // //HACK only use 1 path per chain
        // //TODO get user input (performance or find all funds)
        // let optimized:any = [];
        // blockchains.forEach((network: any) => {
        //     const pathForNetwork = paths.filter((path: { network: any; }) => path.network === network).slice(-1)[0];
        //     if (pathForNetwork) {
        //         optimized.push(pathForNetwork);
        //     }
        // });
        // log.info("optimized: ", optimized.length);
        // app.setPaths(optimized)
        // // //connect
        // // assert(blockchains)
        // // assert(blockchains[0])
        // log.info(tag,"blockchains: ",blockchains.length)
        // console.time('start2paired');
        // let pairObject = {
        //     type:WalletOption.KEEPKEY,
        //     blockchains
        // }
        // resultInit = await app.pairWallet(pairObject)
        // console.timeEnd('start2paired'); // End timing for pairing
        // log.debug(tag,"resultInit: ",resultInit)
        //
        // //check pairing
        // // //context should match first account
        // let context = await app.context
        // log.info(tag,"context: ",context)
        // assert(context)
        //
        // console.time('start2getPubkeys');
        // await app.getPubkeys()
        // console.timeEnd('start2getPubkeys');
        // log.info(tag,"pubkeys: ",app.pubkeys.length)
        // assert(app.pubkeys)
        // assert(app.pubkeys[0])
        //
        // console.time('start2getBalances');
        // await app.getBalances()
        // log.info(tag,"balances: ",app.balances.length)
        // console.timeEnd('start2getBalances');
        //
        // //get all assets
        // // let assets = await app.getAssets()
        // // log.info(tag,"assets: ",assets.length)
        // // assert(assets)
        //
        // //filter for pubkeys
        // let filterForPubkey = {
        //     hasPubkey: true,
        //     onlyOwned: true,
        //     noTokens: false,
        //     // searchQuery:"",
        //     // memoless:true,
        //     // integrations: ['thorswap'],
        //     // networks: ['eip155:1']
        // }
        // let assetsFiltered6 = await app.getAssets(filterForPubkey)
        // log.info(tag,"assetsFiltered: (with pubkey)",assetsFiltered6.length)
        //
        //
        // //filter for balances
        //
        // let filterForBitcoin = {
        //     hasPubkey: false,
        //     onlyOwned:false,
        //     noTokens:true,
        //     searchQuery:"Bitcoin",
        //     // memoless:true,
        //     // integrations: [],
        //     // networks: []
        // }
        // let assetsFilteredSearch = await app.getAssets(filterForBitcoin)
        // log.info(tag,"assetsFiltered: (search bitcoin)",assetsFilteredSearch)
        // log.info(tag,"assetsFiltered: (search bitcoin)",JSON.stringify(assetsFilteredSearch))


        //
        // //filter by base blockchain
        // log.info(tag,"assets: ",assets)
        //
        // const baseNetworkId = 'eip155:8453';
        // const filteredAssets2 = assets.filter((asset: any) => {
        //     // Check if asset belongs to BASE blockchain by networkId
        //     const isBaseAsset = asset.networkId === baseNetworkId;
        //
        //     // Additional conditions can be included if needed, e.g., onlyOwned, noTokens, etc.
        //     // For simplicity, this example focuses on filtering by BASE networkId
        //     return isBaseAsset;
        // });
        // log.info(tag,"filteredAssets: ",filteredAssets2)
        //
        // let onlyOwned = true
        // let noTokens = false
        // let hasPubkey = true
        // let searchQuery = ""
        // const filteredAssets = assets.filter((asset: any) => {
        //     // Ensure asset.name and searchQuery are both strings before calling toLowerCase()
        //     const assetName = asset.name ? asset.name.toLowerCase() : '';
        //     const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase() : '';
        //
        //     return assetName.includes(normalizedSearchQuery) &&
        //       (!onlyOwned || (onlyOwned && asset.balance && parseFloat(asset.balance) > 0)) &&
        //       (!noTokens || (noTokens && asset.type !== 'token')) &&
        //       (!hasPubkey || (hasPubkey && asset.pubkey));
        // });
        // log.info('filteredAssets: ',filteredAssets.length)
        // log.info('filteredAssets: ',filteredAssets[0])
        // log.info('filteredAssets: ',filteredAssets)

        // //setAssetContext
        // let allAssets = await app.getAssets()
        //
        // for(let i = 0; i < allAssets.length; i++){
        //     let asset = allAssets[i]
        //     console.log("asset: ",asset)
        // }
        //
        //test AssetValue
        // await AssetValue.loadStaticAssets();
        // let assetValue = AssetValue.fromChainOrSignature(
        //   Chain.Base,
        //   0,
        // );
        // console.log("assetValue: ",assetValue)
        // console.log("assetValue: ",assetValue.getValue('string'))

        // let assetValue = AssetValue.fromChainOrSignature(
        //   Chain.Base,
        //   "0.001",
        // );
        // console.log("assetValue: ",assetValue)
        // console.log("assetValue: ",assetValue.getValue('string'))

        // if(assetValue.ticker !== 'ETH') throw Error("Invalid ticker for BASE!")


        // let assetValue = AssetValue.fromChainOrSignature(
        //   Chain.Mayachain,
        //   "0.001",
        // );
        // console.log("assetValue: ",assetValue)
        // if(assetValue.ticker !== 'CACAO') throw Error("Invalid ticker for MAYA!")
        // if(assetValue.chain !== 'MAYA') throw Error("Invalid chain for MAYA!")

        // let assetString = 'MAYA.CACAO'
        //
        // await AssetValue.loadStaticAssets();
        // const assetValue = AssetValue.fromStringSync(assetString, parseFloat("0.001"));
        // console.log("assetValue: ",assetValue)

        // let assetString = 'ETH.ETH'
        //
        // await AssetValue.loadStaticAssets();
        // const assetValue = AssetValue.fromStringSync(assetString, parseFloat("0.001"));
        // console.log("assetValue: ",assetValue)

        // let assetString = 'BASE.PRO-0XEF743DF8EDA497BCF1977393C401A636518DD630'
        //
        // await AssetValue.loadStaticAssets();
        // const assetValue = AssetValue.fromStringSync(assetString, parseFloat("0.001"));
        // console.log("assetValue: ",assetValue)

        // let assetString = 'ARB.ETH'
        // let assetString = 'ARB/ETH'
        // let assetString = 'MAYA.MAYA'
        // let assetString = 'ZEC.ZEC'
        // let assetString = 'BASE.ETH'
        // let assetString = 'BASE.PRO-0XEF743DF8EDA497BCF1977393C401A636518DD630'
        // let assetString = 'ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7'
        // let assetString = 'ETH.FOX-0xc770eefad204b5180df6a14ee197d99d808ee52d'

        // await AssetValue.loadStaticAssets();
        // const assetValue = AssetValue.fromStringSync(assetString, parseFloat("500"));
        // console.log("assetValue: ",assetValue)
        // assert(assetValue)
        //
        // console.log("assetValue: ",assetValue?.decimal)
        // console.log("assetValue: ",assetValue?.toString())
        // console.log("assetValue: ",assetValue?.getValue('string'))
        // //verify it set
        
        //get all outputs available
        
        //search for output

        console.log("************************* TEST PASS *************************")
        console.timeEnd('start2end');
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
