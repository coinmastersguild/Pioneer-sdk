/*
    E2E testing
 */

import { AssetValue } from '@coinmasters/helpers';

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test-wallet | "
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
import { WalletOption, availableChainsByWallet, NetworkIdToChain, Chain, FeeOption } from '@coinmasters/types';

const getWalletByChain = async (keepkey:any, chain:any) => {
    if (!keepkey[chain]) return null;

    const walletMethods = keepkey[chain].walletMethods;
    const address = await walletMethods.getAddress();
    if (!address) return null;

    let balance = [];
    let pubkeys = [];
    if (walletMethods.getPubkeys) {
        pubkeys = await walletMethods.getPubkeys();
        for (const pubkey of pubkeys) {
            const pubkeyBalance = await walletMethods.getBalance([{ pubkey }]);
            balance.push(Number(pubkeyBalance[0].toFixed(pubkeyBalance[0].decimal)) || 0);
        }
        //create assetVaule
        balance = [{ total: balance.reduce((a, b) => a + b, 0), address }];

    } else {
        balance = await walletMethods.getBalance([{address}]);
    }

    return { address, pubkeys, balance };
};


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //TODO wtf why await
        const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");
        const { toHexString } = await import('@coinmasters/toolbox-evm');

        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };

        let blockchains:any = []
        
        let AllChainsSupported = blockchains.map(
          (caip: string | number) =>
            NetworkIdToChain[caip] ||
            (() => {
                throw new Error(`Missing CAIP: ${caip}`);
            })(),
        );

        let paths:any = [
            {
                note: ' AVAX primary (default)',
                symbol: 'AVAX',
                symbolSwapKit: 'AVAX',
                network: 'eip155:43114',
                script_type: 'avalanche',
                available_scripts_types: [ 'avalanche' ],
                type: 'address',
                addressNList: [ 2147483692, 2147483708, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483708, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'avalanche'
            },
            {
                note: 'Binance default path',
                type: 'address',
                script_type: 'binance',
                available_scripts_types: [ 'binance' ],
                addressNList: [ 2147483692, 2147484362, 2147483648, 0, 0 ],
                addressNListMaster: [ 2147483692, 2147484362, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'binance',
                symbol: 'BNB',
                symbolSwapKit: 'BNB',
                network: 'binance:bnb-beacon-chain'
            },
            {
                note: 'Bitcoin account Native Segwit (Bech32)',
                blockchain: 'bitcoin',
                symbol: 'BTC',
                symbolSwapKit: 'BTC',
                network: 'bip122:000000000019d6689c085ae165831e93',
                script_type: 'p2wpkh',
                available_scripts_types: [ 'p2pkh', 'p2sh', 'p2wpkh', 'p2sh-p2wpkh' ],
                type: 'zpub',
                addressNList: [ 2147483732, 2147483648, 2147483648 ],
                addressNListMaster: [ 2147483732, 2147483648, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false
            },
            {
                note: 'Bitcoin Cash Default path',
                type: 'xpub',
                script_type: 'p2pkh',
                available_scripts_types: [ 'p2pkh' ],
                addressNList: [ 2147483692, 2147483793, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483793, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'bitcoincash',
                symbol: 'BCH',
                symbolSwapKit: 'BCH',
                network: 'bip122:000000000000000000651ef99cb9fcbe'
            },
            {
                note: ' Default ATOM path ',
                type: 'address',
                script_type: 'cosmos',
                available_scripts_types: [ 'cosmos' ],
                addressNList: [ 2147483692, 2147483766, 2147483648, 0, 0 ],
                addressNListMaster: [ 2147483692, 2147483766, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'cosmos',
                symbol: 'ATOM',
                symbolSwapKit: 'GAIA',
                network: 'cosmos:cosmoshub-4'
            },
            {
                note: ' Default OSMO path ',
                type: 'address',
                script_type: 'bech32',
                available_scripts_types: [ 'bech32' ],
                addressNList: [ 2147483692, 2147483766, 2147483648, 0, 0 ],
                addressNListMaster: [ 2147483692, 2147483766, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'osmosis',
                symbol: 'OSMO',
                symbolSwapKit: 'OSMO',
                network: 'cosmos:osmosis-1'
            },
            {
                note: 'Default ripple path',
                type: 'address',
                coin: 'Ripple',
                symbol: 'XRP',
                symbolSwapKit: 'XRP',
                network: 'ripple:4109C6F2045FC7EFF4CDE8F9905D19C2',
                blockchain: 'ripple',
                script_type: 'p2pkh',
                available_scripts_types: [ 'p2pkh' ],
                addressNList: [ 2147483692, 2147483792, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483792, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false
            },
            {
                note: 'Dogecoin Default path',
                type: 'xpub',
                script_type: 'p2pkh',
                available_scripts_types: [ 'p2pkh' ],
                addressNList: [ 2147483692, 2147483651, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483651, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'dogecoin',
                symbol: 'DOGE',
                symbolSwapKit: 'DOGE',
                network: 'bip122:00000000001a91e3dace36e2be3bf030'
            },
            {
                note: 'Default dash path',
                type: 'xpub',
                coin: 'Dash',
                symbol: 'DASH',
                symbolSwapKit: 'DASH',
                network: 'bip122:000007d91d1254d60e2dd1ae58038307',
                blockchain: 'dash',
                script_type: 'p2pkh',
                available_scripts_types: [ 'p2pkh' ],
                addressNList: [ 2147483692, 2147483653, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483653, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false
            },
            {
                note: ' ETH primary (default)',
                symbol: 'ETH',
                symbolSwapKit: 'ETH',
                network: 'eip155:1',
                script_type: 'ethereum',
                available_scripts_types: [ 'ethereum' ],
                type: 'address',
                addressNList: [ 2147483692, 2147483708, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483708, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'ethereum'
            },
            {
                note: 'Litecoin Default path',
                type: 'xpub',
                script_type: 'p2pkh',
                available_scripts_types: [ 'p2pkh' ],
                addressNList: [ 2147483692, 2147483650, 2147483648 ],
                addressNListMaster: [ 2147483692, 2147483650, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                showDisplay: false,
                blockchain: 'litecoin',
                symbol: 'LTC',
                symbolSwapKit: 'LTC',
                network: 'bip122:12a765e31ffd4059bada1e25190f6e98'
            },
            {
                note: ' Default RUNE path ',
                type: 'address',
                addressNList: [ 2147483692, 2147484579, 2147483648, 0, 0 ],
                addressNListMaster: [ 2147483692, 2147484579, 2147483648, 0, 0 ],
                curve: 'secp256k1',
                script_type: 'thorchain',
                showDisplay: false,
                blockchain: 'thorchain',
                symbol: 'RUNE',
                symbolSwapKit: 'RUNE',
                network: 'cosmos:thorchain-mainnet-v1'
            }
        ]
        log.info("walletKeepKey.wallet: ",walletKeepKey.wallet)
        log.info("walletKeepKey.wallet: ",walletKeepKey.wallet.connect)
        // log.info("walletKeepKey.wallet: ",walletKeepKey.wallet.connect?.connectKeepkey)

        // Define the chainData object
        let keepkey:any = {};
        
        // @ts-ignore
        // Implement the addChain function with additional logging
        function addChain({ chain, walletMethods, wallet }) {
            log.info(`Adding chain: ${chain}`);
            log.info(`Chain data:`, { chain, walletMethods, wallet });
            keepkey[chain] = {
                walletMethods,
                wallet
            };
        }

        let keepkeyConfig = {
          apiKey: 'f74b46ad-592b-4a9a-9941-c99624fefb62',
          pairingInfo: {
              name: "int-test-package",
              imageUrl: "",
              basePath: 'http://localhost:1646/spec/swagger.json',
              url: 'http://localhost:1646',
          }
        }
        let covalentApiKey = 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q'
        let ethplorerApiKey = 'freekey'
        let utxoApiKey = 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2'
        let input = {
            apis: { },
            rpcUrls:{},
            addChain,
            config: { keepkeyConfig, covalentApiKey, ethplorerApiKey, utxoApiKey },
        }
        let chains =  [
            'ETH'
        ]
        // let chains =  [
        //     'ARB',  'AVAX', 'BNB',
        //     'BSC',  'BTC',  'BCH',
        //     'GAIA', 'OSMO', 'XRP',
        //     'DOGE', 'DASH', 'ETH',
        //     'LTC',  'OP',   'MATIC',
        //     'THOR'
        // ]
        // Step 1: Invoke the outer function with the input object
        const connectFunction = walletKeepKey.wallet.connect(input);
    
        // Step 2: Invoke the inner function with chains and paths
        let kkApikey = await connectFunction(chains, paths);
        log.info("kkApikey: ", kkApikey);

        //walletKeepKey
        // log.info("walletKeepKey: ",walletKeepKey.wallet)
        // log.info("connectFunction: ",connectFunction)
        log.info("keepkey: ",keepkey)

        //got balances
        for(let i = 0; i < chains.length; i++) {
            let chain = chains[i]
            let walletData:any = await getWalletByChain(keepkey, chain);
            log.info(chain+ " walletData: ",walletData)
            // keepkey[chain].wallet.address = walletData.address
            keepkey[chain].wallet.pubkeys = walletData.pubkeys
            keepkey[chain].wallet.balance = walletData.balance
        }
        log.info(tag,"keepkey: ",keepkey)
        /*
            TODO
            
            depositThorchain
            depositEthereum
            depositBitcoin
            depositDash
            
            transfer {to amount asset}
            transferCosmos
            transferEthereum
            transferBitcoin
            transferDash
            transferMaya
         */

        /*
                SEND MAYA

         */

        // //get assetValue for asset
        // // let assetString = 'ETH.USDT'
        // let assetString = 'MAYA.CACAO'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.1"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        // //send
        // let sendPayload = {
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_MAYA_ADDRESS'] || 'maya1g9el7lzjwh9yun2c4jjzhy09j98vkhfxfqkl5k',
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Mayachain].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)


        /*
               DEPOSIT MAYA
         */


        // //deposit maya
        // //get assetValue for asset
        // // let assetString = 'ETH.USDT'
        // let assetString = 'MAYA.CACAO'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "20"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        // //send
        // let sendPayload = {
        //     assetValue,
        //     memo: '=:DASH.DASH:Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x::ELD:75'
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Mayachain].walletMethods.deposit(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)

        /*
               SEND ETH
         */

        // //get assetValue for asset
        let assetString = 'ETH.ETH'
        // create assetValue
        // const assetString = `${ASSET}.${ASSET}`;
        console.log('assetString: ', assetString);
        let TEST_AMOUNT = "0.1"
        // await AssetValue.loadStaticAssets();
        log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        await AssetValue.loadStaticAssets();
        let assetValue = await AssetValue.fromString(
          assetString,
          parseFloat(TEST_AMOUNT),
        );
        log.info("assetValue: ",assetValue)


        let address = await keepkey[Chain.Ethereum].walletMethods.getAddress()
        log.info("address: ",address)
        assert(address)
        //send
        let sendPayload = {
            maxFeePerGas: toHexString(BigInt(100 * 1e9)), // Convert Gwei to Wei for consistency
            maxPriorityFeePerGas: toHexString(BigInt(30 * 1e9)), // Convert Gwei to Wei
            from: address,
            assetValue,
            memo: '',
            recipient: process.env['FAUCET_ETH_ADDRESS'] || '0xC3aFFff54122658b89C31183CeC4F15514F34624',
        };
        log.info("sendPayload: ",sendPayload)
        const txHash = await  keepkey[Chain.Ethereum].walletMethods.transfer(sendPayload);
        log.info("txHash: ",txHash)
        assert(txHash)


        /*
               SEND ERC-20
         */

        // //get assetValue for asset
        // let assetString = 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.1"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // await AssetValue.loadStaticAssets();
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        //
        // let address = await keepkey[Chain.Ethereum].walletMethods.getAddress()
        // log.info("address: ",address)
        // assert(address)
        // //send
        // let sendPayload = {
        //     from:address,
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_ETH_ADDRESS'] || '0xC3aFFff54122658b89C31183CeC4F15514F34624',
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Ethereum].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)

        /*
           SEND Bitcoin
         */

        // //get assetValue for asset
        // let assetString = 'BTC.BTC'
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.0005"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // await AssetValue.loadStaticAssets();
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        //
        // let address = await keepkey[Chain.Bitcoin].walletMethods.getAddress()
        // log.info("address: ",address)
        // assert(address)
        // //send
        // let sendPayload = {
        //     from:address,
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_BITCOIN_ADDRESS'],
        // }
        // log.info("sendPayload: ",sendPayload)
        // log.info("keepkey: ",keepkey)
        // log.info("keepkey[Chain.Bitcoin]: ",keepkey)
        // const txHash = await  keepkey[Chain.Bitcoin].walletMethods.transfer(sendPayload);
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
