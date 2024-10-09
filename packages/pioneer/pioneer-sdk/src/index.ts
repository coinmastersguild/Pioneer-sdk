/*

     Pioneer SDK
        A typescript sdk for integrating cryptocurrency wallets info apps

 */
// import loggerdog from "@pioneer-platform/loggerdog";
// @ts-ignore
// import * as Events from "@pioneer-platform/pioneer-events";
// @ts-ignore
// @ts-ignore
// import * as LoggerModule from "@pioneer-platform/loggerdog";
// const log = LoggerModule.default();

import { EVMChainList, SwapKitCore, WalletOption } from '@coinmasters/core';
// import { NativeList } from '@coinmasters/tokens';
import { MayaList, NativeList, PioneerList } from '@coinmasters/tokens';
import type { Chain } from '@coinmasters/types';
import { NetworkIdToChain } from '@coinmasters/types';
// @ts-ignore
import {
  caipToNetworkId,
  caipToThorchain,
  shortListSymbolToCaip,
  tokenToCaip,
} from '@pioneer-platform/pioneer-caip';
// @ts-ignore
import Pioneer from '@pioneer-platform/pioneer-client';
import {
  addressNListToBIP32,
  COIN_MAP_KEEPKEY_LONG,
  getPaths,
  // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
// @ts-ignore
import { assetData } from '@pioneer-platform/pioneer-discovery';
import EventEmitter from 'events';

let MEMOLESS_INTERGRATIONS = ['changelly', 'chainflip'];

const TAG = ' | Pioneer-sdk | ';

export interface PioneerSDKConfig {
  appName: string;
  appIcon: string;
  blockchains: any;
  username: string;
  queryKey: string;
  spec: string;
  wss: string;
  paths: any;
  pubkeys?: any;
  balances?: any;
  keepkeyApiKey: string;
  ethplorerApiKey: string;
  covalentApiKey: string;
  utxoApiKey: string;
  walletConnectProjectId: string;
}

export class SDK {
  // @ts-ignore
  public status: string;

  public username: string;

  public queryKey: string;

  public wss: string;

  // @ts-ignore
  public spec: any;

  public ethplorerApiKey: string;

  public covalentApiKey: string;

  public utxoApiKey: string;

  public walletConnectProjectId: string;

  public contextType: string;

  // @ts-ignore
  public context: string;

  public assetContext: any;

  // @ts-ignore
  public blockchainContext: any;

  // @ts-ignore
  public pubkeyContext: any;

  // @ts-ignore
  public outboundAssetContext: any;

  // @ts-ignore
  public outboundBlockchainContext: any;

  // @ts-ignore
  public outboundPubkeyContext: any;

  public swapKit: any | null;

  public pioneer: any;

  //charts enabled
  public charts: any[];

  // @ts-ignore
  public paths: any[];

  public pubkeys: any[];

  public wallets: any[];

  public balances: any[];

  public assets: any[];

  public assetsMap: any;

  // @ts-ignore
  public nfts: any[];

  public events: any;

  // @ts-ignore
  public pairWallet: (options: any) => Promise<any>;

  // public startSocket: () => Promise<any>;
  // public stopSocket: () => any;
  // public sendToAddress: (tx:any) => Promise<any>;
  // public swapQuote: (tx:any) => Promise<any>;
  // public build: (tx:any) => Promise<any>;
  // public sign: (tx:any, wallet:any) => Promise<any>;
  // public broadcast: (tx:any) => Promise<any>;
  public setContext: (context: string) => Promise<{ success: boolean }>;
  public setContextType: (contextType: string) => Promise<{ success: boolean }>;

  // @ts-ignore
  public refresh: () => Promise<any>;

  // public setPubkeyContext: (pubkeyObj:any) => Promise<boolean>;
  // @ts-ignore
  public setAssetContext: (asset?: any) => Promise<any>;

  // @ts-ignore
  public setOutboundAssetContext: (asset?: any) => Promise<any>;

  // @ts-ignore
  public keepkeyApiKey: string;

  public isPioneer: string | null;

  // @ts-ignore
  public loadBalanceCache: (balances: any) => Promise<void>;
  public loadPubkeyCache: (pubkeys: any) => Promise<void>;
  public getPubkeys: (wallets?: string[]) => Promise<any[]>;
  public getBalances: (filter?: any) => Promise<any[]>;
  public blockchains: any[];
  public clearWalletState: () => Promise<boolean>;
  public setBlockchains: (blockchains: any) => Promise<void>;
  public addBalances: (balances: any) => Promise<void>;
  public appName: string;
  public appIcon: any;
  public init: (walletsVerbose: any, setup: any) => Promise<any>;
  public verifyWallet: () => Promise<void>;
  public setPaths: (paths: any) => Promise<void>;
  public addAsset: (caip: string, data?: any) => Promise<any>;
  public getAssets: (filter?: string) => Promise<any>;
  public getBalance: (caip: string, pubkeys: any, nodes: any) => Promise<any>;
  public getCharts: () => Promise<any>;
  public keepKeySdk: any;
  constructor(spec: string, config: PioneerSDKConfig) {
    this.status = 'preInit';
    this.appName = config.appName || 'unknown app';
    this.appIcon = config.appIcon || 'https://pioneers.dev/coins/keepkey.png';
    // this.spec = spec || config.spec || 'http://127.0.0.1:9001/spec/swagger.json';
    this.spec = spec || config.spec || 'https://pioneers.dev/spec/swagger';
    this.wss = config.wss || 'wss://pioneers.dev';
    this.username = config.username;
    this.queryKey = config.queryKey;
    this.keepkeyApiKey = config.keepkeyApiKey;
    this.ethplorerApiKey = config.ethplorerApiKey;
    this.covalentApiKey = config.covalentApiKey;
    this.utxoApiKey = config.utxoApiKey;
    this.walletConnectProjectId = config.walletConnectProjectId;
    this.paths = config.paths || [];
    this.blockchains = config.blockchains || [];
    this.pubkeys = config.pubkeys || [];
    this.balances = config.balances || [];
    this.charts = ['covalent', 'zapper'];
    this.nfts = [];
    this.isPioneer = null;
    this.pioneer = null;
    this.swapKit = null;
    this.context = '';
    this.contextType = WalletOption.KEEPKEY;
    this.pubkeyContext = null;
    this.assetContext = null;
    this.blockchainContext = null;
    this.outboundAssetContext = null;
    this.outboundBlockchainContext = null;
    this.outboundPubkeyContext = null;
    this.wallets = [];
    this.events = new EventEmitter();
    this.init = async function (walletsVerbose: any, setup: any) {
      const tag = `${TAG} | init | `;
      try {
        if (!this.username) throw Error('username required!');
        if (!this.queryKey) throw Error('queryKey required!');
        if (!this.wss) throw Error('wss required!');
        if (!walletsVerbose) throw Error('walletsVerbose required!');
        if (!this.wallets) throw Error('wallets required!');
        if (!this.paths) throw Error('wallets required!');
        if (!this.ethplorerApiKey) throw Error('ethplorerApiKey required!');
        if (!this.covalentApiKey) throw Error('covalentApiKey required!');
        if (!this.utxoApiKey) throw Error('utxoApiKey required!');
        if (!this.walletConnectProjectId) throw Error('walletConnectProjectId required!');
        const PioneerClient = new Pioneer(config.spec, config);
        this.pioneer = await PioneerClient.init();
        if (!this.pioneer) throw Error('Fialed to init pioneer server!');
        //console.log(tag, 'setup: ', setup);
        //this.wallets = walletsVerbose
        this.wallets = walletsVerbose;
        let walletArray = [];
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.wallets.length; i++) {
          let walletVerbose = this.wallets[i];
          let wallet = walletVerbose.wallet;
          walletArray.push(wallet);
        }
        // log.info("wallets",this.wallets)
        //console.log(tag, 'this.paths: ', this.paths.length);
        //force paths if not set
        if (this.blockchains.length > 0 && this.paths.length === 0)
          this.setPaths(getPaths(this.blockchains));

        // init swapkit
        this.swapKit = new SwapKitCore();

        await this.getAssets();

        // log.info(tag,"this.swapKit: ",this.swapKit)
        const { ethplorerApiKey } = this;
        const { covalentApiKey } = this;
        const { utxoApiKey } = this;
        if (!utxoApiKey) throw Error('Unable to get utxoApiKey!');
        const { walletConnectProjectId } = this;
        const stagenet = false;
        const configKit = {
          config: {
            ethplorerApiKey,
            covalentApiKey,
            utxoApiKey,
            walletConnectProjectId,
            stagenet,
            keepkeyConfig: {
              apiKey: this.keepkeyApiKey,
              pairingInfo: {
                name: this.appName,
                imageUrl: this.appIcon,
                basePath: 'http://localhost:1646/spec/swagger.json',
                url: 'http://localhost:1646',
              },
            },
          },
          wallets: walletArray,
        };
        // console.log(tag, 'configKit: ', configKit);
        await this.swapKit.extend(configKit);
        this.events.emit('SET_STATUS', 'init');

        //load from cache
        if (setup.pubkeys) {
          this.loadPubkeyCache(setup.pubkeys);
        }

        if (setup.balances) {
          this.loadBalanceCache(setup.balances);
        }

        //@TODO load user
        // let user = await this.pioneer.User();
        // console.log(tag, 'user: ', user);
        // if (!this.pioneer) throw Error('Failed to init pioneer server!');

        //if user
        //if pubkeys load
        //if balances load

        //else defaults
        // this.setAssetContext(
        //   this.assetsMap.get('bip122:000000000019d6689c085ae165831e93/slip44:0'),
        // );
        // this.setOutboundAssetContext(this.assetsMap.get('eip155:1/slip44:60'));

        return this.pioneer;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setPaths = async function (newPaths) {
      try {
        if (!newPaths) throw new Error('paths required!');

        // Ensure paths is an array
        if (!Array.isArray(newPaths)) {
          throw new Error('Paths should be an array!');
        }

        // Check for duplicates before adding
        newPaths.forEach((path: any) => {
          if (!this.paths.some((existingPath: any) => existingPath === path)) {
            this.paths.push(path);
          }
        });

        // Emit event after updating paths
        this.events.emit('SET_PATHS', this.paths);
      } catch (e) {
        console.error('Failed to load paths! Error: ', e);
      }
    };
    // this.setPaths = async function (paths: any) {
    //   try {
    //     if (!paths) throw Error('paths required!');
    //     //log.debug('setPaths called! paths: ', paths);
    //     this.paths = paths;
    //     this.events.emit('SET_PATHS', this.paths);
    //   } catch (e) {
    //     console.error('Failed to load balances! e: ', e);
    //   }
    // };
    this.setBlockchains = async function (blockchains: any) {
      try {
        if (!blockchains) throw Error('blockchains required!');
        //log.debug('setBlockchains called! blockchains: ', blockchains);
        this.blockchains = blockchains;
        this.events.emit('SET_BLOCKCHAINS', this.blockchains);
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
      }
    };
    this.addAsset = async function (caip: string, data: any) {
      let tag = TAG + ' | addAsset | ';
      try {
        let success = false;
        if (!caip) throw new Error('caip required!');

        let dataLocal = assetData[caip];
        //console.log(tag, 'dataLocal: ', dataLocal);
        //get assetData from discover
        if (!dataLocal) {
          if (!data.networkId) throw new Error('networkId required! can not build asset');
          if (!data.chart) throw new Error('chart required! can not build asset');
          console.error(tag, '*** DISCOVERY *** ', data);
          console.error(tag, 'Failed to build asset for caip: ', caip);
          //build asset
          let asset: any = {};
          asset.source = data.chart;
          asset.caip = caip;
          asset.networkId = data.networkId;
          //Zapper chart
          if (data.token && data.token.symbol) asset.symbol = data.token.symbol;
          if (data.token && data.token.name) asset.name = data.token.name;
          if (data.token && data.token.decimals) asset.decimals = data.token.decimals;
          if (data.token && data.token.coingeckoId) {
            //get image
            // const response = await fetch(
            //   `https://api.coingecko.com/api/v3/coins/${data.token.coingeckoId}`,
            // );
            // const result = await response.json();
            // console.log(tag, 'result: ', result);
            asset.icon = 'https://pioneers.dev/coins/pioneer.png';
          }

          //common
          asset.raw = JSON.stringify(data);
          //verify
          if (!asset.symbol) throw new Error('symbol required! can not build asset');
          if (!asset.name) throw new Error('name required! can not build asset');
          if (!asset.decimals) throw new Error('decimals required! can not build asset');

          //post to pioneer-discovery
          // let resultSubmit = await this.pioneer.Discovery({asset})
          // console.log(tag, 'resultSubmit: ', resultSubmit);

          //set locally into assetMap
          this.assetsMap.set(caip, asset);
          success = true;
        } else {
          this.assetsMap.set(caip, dataLocal);
          success = true;
        }

        return success;
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
      }
    };
    this.addBalances = async function (balances: any) {
      try {
        if (!balances) throw new Error('balances required!');

        // Add only unique balances without overwriting existing ones
        const uniqueBalances = balances.reduce((acc: any, balance: any) => {
          const existingIndex = acc.findIndex((b: any) => b.ref === balance.ref);
          if (existingIndex === -1) {
            acc.push(balance);
          }
          return acc;
        }, this.balances || []);

        this.balances = uniqueBalances;
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
      }
    };
    this.loadBalanceCache = async function (balances: any) {
      try {
        if (balances.length === 0) throw Error('No balances to load!');
        const combinedBalances = [...this.balances, ...balances];

        // Remove duplicates based on .caip and .ref properties
        const uniqueBalances = combinedBalances.reduce((acc, currentItem) => {
          if (
            !acc.some(
              (item: { caip: any; ref: any }) =>
                item.caip === currentItem.caip && item.ref === currentItem.ref,
            )
          ) {
            acc.push(currentItem);
          }
          return acc;
        }, []);

        this.addBalances(uniqueBalances);
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
      }
    };
    this.loadPubkeyCache = async function (pubkeys: any) {
      try {
        if (pubkeys.length === 0) throw Error('No pubkeys to load!');
        const combinedPubkeys = [...this.pubkeys, ...pubkeys];
        //console.log('combinedPubkeys: ', combinedPubkeys);
        // Remove duplicates based on .pubkey property
        this.pubkeys = combinedPubkeys.reduce((acc, currentItem) => {
          if (!acc.some((item: { pubkey: any }) => item.pubkey === currentItem.pubkey)) {
            acc.push(currentItem);
          }
          return acc;
        }, []);
        //console.log('checkpoint 1 this.pubkeys: ', this.pubkeys);

        //combine pubkeys with balances
        //update assets
        const pubkeysMap = new Map();
        this.pubkeys.forEach((pubkey: any) => {
          pubkey.networks.forEach((network: any) => {
            if (!pubkeysMap.has(network)) {
              pubkeysMap.set(network, []);
            }
            pubkeysMap.get(network).push(pubkey);
          });
        });
        //console.log('new pubkeys: ', this.pubkeys);
        this.events.emit('SET_PUBKEYS', this.pubkeys);
      } catch (e) {
        console.error('Failed to load pubkeys! e: ', e);
      }
    };
    this.pairWallet = async function (options: any) {
      const tag = `${TAG} | pairWallet | `;
      try {
        //console.log(tag, 'pairWallet options: ', options);
        let wallet = options.type;
        // let blockchains = options.blockchains;
        if (!wallet) throw Error('Must have wallet to pair! (Invalid params into pairWallet)');
        if (!this.swapKit) throw Error('SwapKit not initialized!');
        // if (!blockchains) throw Error('Must have blockchains to pair!');
        let ledgerApp;
        if (options.ledgerApp) {
          ledgerApp = options.ledgerApp;
        }
        if (options.type === 'KEYSTORE') {
          if (!options.seed) throw Error('Must have seed to pair keystore!');
        }
        // this.blockchains = blockchains;
        //console.log('this.wallets: ', this.wallets);
        const walletSelected = this.wallets.find((w: any) => w.type === wallet);
        if (!walletSelected) throw Error('Wallet not found!');
        //console.log('NetworkIdToChain: ', NetworkIdToChain);
        // let AllChainsSupported = blockchains.map(
        //   (networkId: string | number) =>
        //     NetworkIdToChain[networkId] ||
        //     (() => {
        //       throw new Error(`(NetworkIdToChain) Missing NetworkId: ${networkId}`);
        //     })(),
        // );

        // await this.verifyWallet();

        let resultPair: string;
        //console.log(tag, 'type: ', walletSelected.type);
        let ChainsConfigured = this.blockchains.map((networkId: string) => {
          const chain = NetworkIdToChain[networkId.toLowerCase()];
          if (!chain) {
            console.error(`(NetworkIdToChain) Missing NetworkId: ${networkId}`);
            return null; // or any other appropriate fallback value
          }
          return chain;
        });
        console.log(tag, 'ChainsConfigured: ', ChainsConfigured);
        //TODO filter for supported chains by wallet
        switch (walletSelected.type) {
          case 'KEEPKEY':
            //console.log(tag, 'this.blockchains: ', this.blockchains);
            //console.log(tag, 'this.paths: ', this.paths.length);
            // eslint-disable-next-line no-case-declarations
            let { keepkeyApiKey, info, keepKeySdk } =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                ChainsConfigured,
                this.paths,
              )) || '';
            this.keepkeyApiKey = keepkeyApiKey;
            this.keepKeySdk = keepKeySdk;
            this.context = 'keepkey:' + info.label + '.json';
            console.log(tag, 'info: ', info);
            console.log(tag, 'this.context: ', this.context);
            console.log(tag, 'this.keepkeyApiKey: ', this.keepkeyApiKey);
            resultPair = 'success';
            break;
          case 'WALLETCONNECT':
            resultPair =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName]([
                EVMChainList[0],
              ])) || '';
            break;
          case 'EVM':
            resultPair =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                EVMChainList[0],
              )) || '';
            break;
          case 'METAMASK':
            resultPair =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                ChainsConfigured,
              )) || '';
            break;
          case 'KEYSTORE':
            resultPair =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                ChainsConfigured,
                options.seed,
                0,
              )) || '';
            break;
          case 'LEDGER':
            try {
              if (!ledgerApp) throw Error('Ledger app required for ledger pairing!');

              if (ledgerApp === 'ETH') {
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < EVMChainList.length; i++) {
                  resultPair =
                    (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                      EVMChainList[i],
                      this.paths,
                    )) || '';
                }
              } else {
                resultPair =
                  (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                    ledgerApp,
                    this.paths,
                  )) || '';
              }
            } catch (e: any) {
              console.error('Failed to pair ledger! e: ', e);
              if (e.toString().indexOf('LockedDeviceError') > -1) {
                return { error: 'LockedDeviceError' };
              }
              if (e.toString().indexOf('claimInterface') > -1) {
                return { error: 'claimInterface' };
              }
              if (e.toString().indexOf('decorateAppAPIMethods') > -1) {
                return { error: 'WrongAppError' };
              }
              if (e.toString().indexOf('TransportStatusError') > -1) {
                return { error: 'WrongAppError' };
              }
              return { error: 'Unknown Error' };
            }
            break;
          default:
            resultPair =
              (await (this.swapKit as any)[walletSelected.wallet.connectMethodName](
                this.blockchains,
              )) || '';
            break;
        }

        if (resultPair) {
          // update
          const matchingWalletIndex = this.wallets.findIndex((w) => w.type === wallet);
          //console.log(tag, 'matchingWalletIndex: ', matchingWalletIndex);
          // get balances
          // @ts-ignore
          let context;
          if (wallet === 'LEDGER' && ledgerApp !== 'ETH') {
            context = 'ledger:ledger.wallet'; //placeholder until we know eth address
          } else {
            // console.log('this.swapKit: ', this.swapKit);
            //console.log('wallet: ', wallet);
            context = `${wallet.toLowerCase()}:device.wallet`;

            // isPioneer?
            // get pioneer status
            let pioneerInfo = await this.pioneer.GetPioneer({
              address: context,
            });
            pioneerInfo = pioneerInfo.data;
            //log.debug('pioneerInfo: ', pioneerInfo);
            if (pioneerInfo.isPioneer) {
              this.isPioneer = pioneerInfo.image;
            }
          }

          //console.log('context: ', context);
          // add context to wallet
          //@ts-ignore
          // this.wallets[matchingWalletIndex].context = context;
          //@ts-ignore
          // this.wallets[matchingWalletIndex].connected = true;
          this.wallets[matchingWalletIndex].status = 'connected';
          await this.setContext(context);
          // console.log('assets pre: ', this.assets.length);
          // await this.getAssets();
          // console.log('assets post: ', this.assets.length);

          // await this.getPubkeys();
          // await this.getBalances();
        } else {
          throw Error(`Failed to pair wallet! ${walletSelected.type}`);
        }

        return resultPair;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.clearWalletState = async function () {
      const tag = `${TAG} | clearWalletState | `;
      try {
        // @ts-ignore
        this.context = null;
        this.contextType = WalletOption.KEEPKEY;
        this.paths = [];
        this.blockchains = [];
        this.pubkeys = [];
        return true;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    /*
      Get Asset Rules

      asset MUST have a balance if a token to be tracked
      asset MUST have a pubkey to be tracked

     */
    //@ts-ignore
    this.getAssets = async function (filterParams?: any) {
      try {
        const tag = `${TAG} | getAssets | `;
        console.log(tag, 'filterParams: ', filterParams);
        //Array.from(this.assetsMap.values())
        if (
          !this.assetsMap ||
          Array.from(this.assetsMap.values()).length === 0 ||
          (filterParams && !filterParams.onlyOwned)
        ) {
          console.log('No cached assets, loading...');
          let tokenMap = new Map();
          let chains = new Set();
          let chainTokenCounts = {};
          this.assetsMap = new Map();
          let allAssets = [];
          // Function to add tokens with their source list
          const addTokens = (tokens, sourceList) => {
            tokens.forEach((token) => {
              chains.add(token.chain);
              chainTokenCounts[token.chain] = (chainTokenCounts[token.chain] || 0) + 1;
              // console.log('*** token: ', token);
              let expandedInfo = tokenToCaip(token);

              if (expandedInfo.caip) {
                expandedInfo.sourceList = sourceList;
                let assetInfoKey = expandedInfo.caip.toLowerCase();
                // console.log(tag, 'assetInfoKey: ', assetInfoKey);

                let assetInfo =
                  assetData[expandedInfo.caip] || assetData[expandedInfo.caip.toLowerCase()];
                if (assetInfo) {
                  let combinedInfo = { ...expandedInfo, ...assetInfo, integrations: [] }; // Prepare integration array
                  console.log(tag, 'combinedInfo: ', combinedInfo.networkId);
                  if (
                    this.blockchains.includes(combinedInfo.networkId) ||
                    (filterParams && !filterParams.onlyOwned)
                  ) {
                    // const balances = this.balances.filter(
                    //   (b) => b.caip.toLowerCase() === combinedInfo.caip.toLowerCase(),
                    // );
                    // const pubkeys = this.pubkeys.filter((pubkey: any) =>
                    //   pubkey.networks.includes(combinedInfo.networkId),
                    // );
                    // combinedInfo = { ...combinedInfo, balances, pubkeys };
                    tokenMap.set(assetInfoKey, combinedInfo);
                    allAssets.push(combinedInfo);
                  } else {
                    console.error('***  Skipping token: ', token.networkId);
                    console.error('***  Not in supported blockchains: ', this.blockchains);
                  }
                } else {
                  //TODO deal witht this at some point, generate caips on a the fly?
                  console.error('Missing assetData(PIONEER DATA) for: ', token);
                }
              } else {
                console.error('***  expandedInfo: ', expandedInfo);
                console.error('***  Failed to expand token: ', token);
              }
            });
          };

          // Add tokens from various lists with their source
          let primaryAssets = [NativeList, MayaList, PioneerList];
          let tokenAssets = [
            // StargateARBList,
            // SushiswapList,
            // ThorchainList,
            // TraderjoeList,
            // UniswapList,
            // WoofiList,
            // CoinGeckoList,
            // OneInchList,
            // PancakeswapETHList,
            // PancakeswapList,
            // PangolinList,
          ];
          let tokenLists = [...tokenAssets, ...primaryAssets];
          console.log(tag, 'tokenLists: ', tokenLists.length);
          tokenLists.forEach((list: any) => addTokens(list.tokens, list.name));

          //get custom tokens from db

          //add to map

          // Get integration support by asset and enrich the token map with this data
          //TODO is this really needed? cant it be app side?
          // if (this.pioneer) {
          //   let integrationSupport = await this.pioneer.SupportByAsset();
          //   integrationSupport = integrationSupport.data || {};
          //   //console.log('integrationSupport: ', integrationSupport);
          //
          //   // Enrich tokenMap directly with integration support
          //   Object.keys(integrationSupport).forEach((key) => {
          //     integrationSupport[key].forEach((id) => {
          //       if (id) {
          //         let asset = tokenMap.get(id.toLowerCase());
          //         if (asset) {
          //           if (MEMOLESS_INTERGRATIONS.indexOf(key) > -1) asset.memoless = true;
          //           asset.integrations.push(key);
          //         }
          //       }
          //     });
          //   });
          // }

          console.log('tokenMap: ', Object.keys(tokenMap).length);
          console.log('Processed Assets: ', allAssets.length);
          //filter assets for blockchain
          this.assetsMap = tokenMap; // Update the main map to include all enriched assets
          this.events.emit('SET_ASSETS', this.assetsMap);
          //default
          if (!filterParams)
            filterParams = {
              hasPubkey: true,
              onlyOwned: false,
              noTokens: true,
            };
        }
        // console.log('this.assetsMap: ', this.assetsMap);

        // Filter params
        if (filterParams) {
          //console.log(tag, 'Applying filters...', filterParams);

          // Convert the assetMap to an array
          let currentAssets = Array.from(this.assetsMap.values());
          // console.log(tag, 'currentAssets: ', currentAssets);
          // Initial assets count
          //console.log(tag, `Total assets before filtering: ${currentAssets.length}`);

          // Filter by Search Query
          if (filterParams.searchQuery) {
            const normalizedSearchQuery = filterParams.searchQuery.toLowerCase();
            currentAssets = currentAssets.filter((asset) => {
              const assetName = asset.name ? asset.name.toLowerCase() : '';
              return assetName.includes(normalizedSearchQuery);
            });
            //console.log(tag, `Assets after search query filter: ${currentAssets.length}`);
          }

          // Filter by Ownership Presence
          if (filterParams.onlyOwned) {
            // TODO: Scan this.balances for caip match
            currentAssets = currentAssets.filter((asset) =>
              this.balances.some((balance) => balance.caip === asset.caip),
            );
            //console.log(tag, `Assets after ownership filter: ${currentAssets.length}`);
          }

          // Filter by Token Type
          if (filterParams.noTokens && filterParams.noTokens === true) {
            //console.log(tag, `Before token type filter: ${currentAssets.length}`);
            currentAssets = currentAssets.filter((asset) => asset.type !== 'token');
            //console.log(tag, `Assets after token type filter: ${currentAssets.length}`);
          }

          // Filter by Memoless
          if (filterParams.memoless !== null && filterParams.memoless !== undefined) {
            currentAssets = currentAssets.filter((asset) => asset.memoless === true);
            //console.log(tag, `Assets after memo-less filter: ${currentAssets.length}`);
          }

          // Filter by Public Key Presence
          if (filterParams.hasPubkey) {
            //console.log(tag, `Before token hasPubkey filter: ${currentAssets.length}`);
            //console.log(tag, this.pubkeys);
            // TODO: Filter this.pubkeys for a match
            currentAssets = currentAssets.filter((asset: any) => {
              return this.pubkeys.some((pubkey: any) => {
                if (pubkey.networks.includes(asset.networkId)) {
                  return true;
                }

                if (asset.networkId.startsWith('eip155')) {
                  return pubkey.networks.some((network: string) => network.startsWith('eip155'));
                }

                return false;
              });
            });
            //console.log(tag, `Assets after public key presence filter: ${currentAssets.length}`);
          }

          // Filter by Required Integration
          if (filterParams.integrations && filterParams.integrations.length > 0) {
            // console.log(
            //   tag,
            //   `Looking for integrations in assets: ${filterParams.integrations.join(', ')}`,
            // );

            currentAssets = currentAssets.filter((asset) => {
              if (!asset.integrations) {
                //console.log(tag, `Asset ${asset.name} has no integrations.`);
                return false;
              }

              const hasRequiredIntegration = filterParams.integrations.some((integration) =>
                asset.integrations.includes(integration),
              );

              if (!hasRequiredIntegration) {
                // console.log(
                //   tag,
                //   `Asset ${
                //     asset.name
                //   } does not include required integrations. Asset integrations: ${asset.integrations.join(
                //     ', ',
                //   )}`,
                // );
              }

              return hasRequiredIntegration;
            });

            //console.log(tag, `Assets after required integration filter: ${currentAssets.length}`);
          }

          // Filter by Required networkId
          if (filterParams.networks && filterParams.networks.length > 0) {
            currentAssets = currentAssets.filter(
              (asset) =>
                asset.networkId && // Ensure the asset has a networkId defined
                filterParams.networks.includes(asset.networkId), // Check if the asset's networkId is in the list of required networks
            );
            //console.log(tag, `Assets after required networks filter: ${currentAssets.length}`);
          }

          // Filter by Asset Context (if applicable)
          if (this.assetContext) {
            currentAssets = currentAssets.filter((asset) => asset.caip !== this.assetContext.caip);
            //console.log(tag, `Assets after asset context filter: ${currentAssets.length}`);
          }

          // console.log(tag, `Total assets after all filters: ${currentAssets}`);
          //console.log(tag, `Total assets after all filters: ${currentAssets.length}`);
          return currentAssets;
        } else {
          // Return assets as an array from assetMap if no filters are applied
          return Array.from(this.assetsMap.values());
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.getPubkeys = async function (wallets?: any) {
      const tag = `${TAG} | getPubkeys | `;
      try {
        //console.log(tag, 'this.blockchains: ', this.blockchains);
        //console.log(tag, 'this.paths: ', this.paths.length);
        if (this.paths.length === 0) throw new Error('No paths found!');
        if (!this.swapKit) throw new Error('SwapKit not initialized!');
        //console.log(tag, 'PRE this.pubkeys: ', this.pubkeys.length);
        //console.log(tag, 'PRE this.paths: ', this.paths.length);
        //console.log(tag, 'PRE this.blockchains: ', this.blockchains);

        let pubkeysNew = [];
        // For each enabled blockchain
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.blockchains.length; i++) {
          let blockchain = this.blockchains[i];
          //console.log(tag, 'blockchain: ', blockchain);

          let filteredPaths = this.paths.filter((path) => {
            // Ensure path.networks is defined
            if (!path.networks) {
              console.error('path.networks is undefined for path: ', path);
              return false;
            }

            // Handle special case for eip155
            if (blockchain.startsWith('eip155')) {
              return path.networks.some((network) => network.startsWith('eip155:'));
            }

            // General case
            return path.networks.includes(blockchain);
          });

          //console.log(tag, 'filteredPaths: ', filteredPaths);

          if (!filteredPaths || filteredPaths.length === 0)
            throw new Error('Unable to get pubkey for blockchain: ' + blockchain);

          // Get address for all paths for this blockchain
          for (let path of filteredPaths) {
            let chain: Chain = NetworkIdToChain[blockchain];
            //console.log(tag, 'chain: ', chain);

            if (!chain) throw new Error('missing chain for blockchain!');

            let pubkey: any = {};
            pubkey.type = path.type;
            //console.log(tag, 'path: ', path);

            let addressInfo = {
              address_n: path.addressNListMaster,
              coin: COIN_MAP_KEEPKEY_LONG[chain],
              script_type: path.script_type,
              showDisplay: false,
            };

            //console.log(tag, 'addressInfo: ', addressInfo);
            let address = await this.swapKit?.getAddressAsync(chain, addressInfo);
            if (!address) throw new Error(`Failed to get address for ${chain}`);
            if (address && address.indexOf('bitcoincash:') > -1)
              address = address.replace('bitcoincash:', '');

            pubkey.master = address;

            if (path.type === 'address') {
              pubkey.address = address;
              pubkey.pubkey = address;
            } else if (path.type === 'xpub' || path.type === 'ypub' || path.type === 'zpub') {
              let pubkeys = await this.swapKit?.getWallet(chain)?.getPubkeys([path]);
              if (!pubkeys) throw new Error(`Failed to get pubkeys for ${chain}`);
              //console.log(tag, ' [path]: ', [path]);
              //console.log(tag, '[path]  pubkeys: ', pubkeys);

              // let pubkeyForPath = pubkeys[0];
              // console.log(tag, ' pubkeyForPath: ', pubkeyForPath);

              let pubkeyForPath = pubkeys.find(
                (p: any) =>
                  p.addressNList.toString() + p.script_type ===
                  path.addressNList.toString() + path.script_type,
              );

              if (!pubkeyForPath) throw new Error(`Failed to get pubkey for path in ${chain}`);

              if (pubkeyForPath) pubkey.pubkey = pubkeyForPath.xpub || pubkeyForPath.zpub;
              if (!pubkeyForPath) throw new Error(`Failed to get pubkey for path in ${chain}`);
            }
            pubkey.note = path.note;
            pubkey.available_scripts_types = path.available_scripts_types;
            pubkey.path = addressNListToBIP32(path.addressNList);
            pubkey.pathMaster = addressNListToBIP32(path.addressNListMaster);
            pubkey.context = this.context;
            pubkey.contextType = this.contextType.split(':')[0];
            pubkey.networks = path.networks;
            pubkeysNew.push(pubkey);
          }
        }

        // add pubkeys to this.pubkeys
        pubkeysNew.forEach((newPubkey: any) => {
          const exists = this.pubkeys.some(
            (existingPubkey: any) => existingPubkey.pubkey === newPubkey.pubkey,
          );
          if (!exists) {
            this.pubkeys.push(newPubkey);
          }
        });
        this.events.emit('SET_PUBKEYS', this.pubkeys);

        return pubkeysNew;
      } catch (e) {
        console.error(tag, 'Error: ', e);
        throw e;
      }
    };
    this.getBalance = async function (caip: string, pubkeys: any, nodes: any) {
      const tag = `${TAG} | getBalance | `;
      try {
        //console.log(tag, 'caip: ', caip);
        let asset = this.assetsMap.get(caip);
        if (!asset) {
          //TODO get asset chart from pioneer
          console.error(this.assetsMap);
          throw Error('unknown asset! ' + caip);
        }
        //caipToNetworkId
        let networkId = asset.networkId;
        let chain = NetworkIdToChain[networkId];
        if (!chain) throw Error('missing chain for networkId: ' + networkId);
        if (networkId.includes('eip155:')) {
          networkId = 'eip155:*';
        }
        let pubkeys = this.pubkeys.filter((pubkey: any) => pubkey.networks.includes(networkId));
        if (!pubkeys || pubkeys.length === 0)
          throw Error('missing pubkeys for networkId: ' + networkId);
        //TODO get nodes for chain
        let nodes = [];
        let balance = await this.swapKit?.getBalance(chain, pubkeys, nodes);
        if (!balance) throw Error('failed to get balance for chain: ' + networkId);
        //console.log(tag, 'balance: ', balance);

        if (!balance.caip) throw Error('invalid balnace! caip required!');
        //console.log(tag, 'balance: ', balance);
        if (!balance.ticker) throw Error('invalid balance! ticker required!');
        //console.log(tag, 'caip: ', balance.caip);
        //console.log(tag, 'ticker: ', balance.ticker);
        let balanceString: any = {};
        // Balance formatted
        balanceString.context = this.context;
        balanceString.contextType = this.context.split(':')[0];
        balanceString.caip = balance.caip;
        balanceString.pubkey = balance.pubkey;
        balanceString.ref = balance.context + balance.caip;
        balanceString.identifier = caipToThorchain(balance.caip, balance.ticker);
        balanceString.networkId = caipToNetworkId(balance.caip);
        balanceString.symbol = balance.symbol;
        balanceString.chain = balance.chain;
        balanceString.ticker = balance.ticker;
        balanceString.type = balance.type;
        balanceString.balance = balance.getValue('string');
        let priceData: any = {};
        try {
          priceData = await this.pioneer.MarketInfo({
            caip: balanceString.caip.toLowerCase(),
          });
          priceData = priceData.data;
        } catch (e) {
          console.error('No Market Data for: ', balanceString.caip);
        }
        //console.log(tag, 'priceData: ', priceData);
        if (!priceData) console.error('Unable to get price data for asset: ', balanceString.caip);
        balanceString.priceUsd = priceData.priceUsd || 0;
        balanceString.valueUsd = balanceString.balance * balanceString.priceUsd;
        return balanceString;
      } catch (e) {
        console.error(tag, 'Error: ', e);
        throw e;
      }
    };
    this.getBalances = async function (networks?: any) {
      const tag = `${TAG} | getBalances | `;
      try {
        if (!this.assets || this.assets.length === 0) await this.getAssets();
        // if (!this.context) throw Error('No Wallet Paired! No context!');
        //console.log(tag, 'this.blockchains: ', this.blockchains);
        let balances = [];

        // Create an array of promises for fetching balances
        const balancePromises = this.blockchains.map(async (blockchain: any) => {
          let chain: Chain = NetworkIdToChain[blockchain];
          //console.log(tag, 'chain: ', chain);

          // Get pubkeys for the chain
          let pubkeys = this.pubkeys.filter((pubkey: any) => {
            if (blockchain.includes('eip155')) {
              return pubkey.networks.includes(`eip155:*`);
            }
            return pubkey.networks.includes(blockchain);
          });

          //console.log(tag, 'pubkeys: ', pubkeys);

          if (pubkeys && pubkeys.length > 0) {
            try {
              let nodes = [];
              // Get primary gas asset for chain
              let caip = shortListSymbolToCaip[chain];
              let resultBalance = await this.getBalance(caip, pubkeys, nodes);
              //console.log('resultBalance: ', resultBalance);
              if (resultBalance) return resultBalance;
            } catch (e) {
              console.error(tag, 'e: ', e);
              console.error(tag, 'failed to get balance for chain: ', chain);
            }
          } else {
            console.error(tag, 'no pubkeys for chain: ', chain);
          }
          return null;
        });

        // Wait for all the promises to resolve
        const resolvedBalances = await Promise.all(balancePromises);

        // Filter out null results and merge the balances
        balances = resolvedBalances.filter((result: any) => result !== null);

        //console.log(tag, 'balances: ', balances);
        this.balances = balances;
        //console.log(tag, 'this.balances: ', this.balances);
        this.events.emit('SET_BALANCES', this.balances);
        return balances;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    /*
        Charts

        * get enabled charts
        * get avaailable charts by networkId
        * add chart
        * remove chart
        * update chart

    */
    this.getCharts = async function () {
      const tag = `${TAG} | getCharts | `;
      const TIMEOUT = 10000; // 10 seconds timeout
      try {
        // Get ETH address
        let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes('eip155:*'));
        //console.log(tag, 'pubkeys: ', pubkeys);
        if (!pubkeys[0]) {
          console.error(tag, 'No ETH address found, not charting');
          return [];
        }

        let address = pubkeys[0].address;

        // Get all eip155 enabled chains
        let evmChains = this.blockchains.filter((chain) => chain.includes('eip155'));
        //console.log(tag, 'evmChains: ', evmChains);

        //remove slow chains
        const ignoredNetworkIds = ['eip155:137'];

        // Filter out the chains with network IDs in the ignoredNetworkIds array
        evmChains = evmChains.filter((chain) => !ignoredNetworkIds.includes(chain.networkId));
        //console.log(tag, 'evmChains: ', evmChains);

        // Function to add a timeout to a promise
        const withTimeout = (promise, chain) => {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              console.error(
                `${tag} Timeout: NetworkId ${chain} took longer than ${TIMEOUT / 1000} seconds`,
              );
              resolve({ chain, result: { data: { items: [] } } }); // Resolve with empty result on timeout
            }, TIMEOUT);
            promise.then(
              (result) => {
                clearTimeout(timer);
                resolve({ chain, result });
              },
              (error) => {
                clearTimeout(timer);
                reject(error);
              },
            );
          });
        };

        // Fetch NFTs for each chain concurrently
        let nftPromises = evmChains.map((chain) => {
          console.time(`${tag} NetworkId ${chain}`);
          return withTimeout(
            this.pioneer.GetCovalentNfts({ address, networkId: chain }),
            chain,
          ).then((result) => {
            console.timeEnd(`${tag} NetworkId ${chain}`);
            return result;
          });
        });

        let nftResults = await Promise.all(nftPromises);
        let NFTs = [];

        nftResults.forEach(({ chain, result }) => {
          if (result.data.items && result.data.items.length > 0) {
            result.data.items.forEach((item: any) => {
              if (item.nft_data) {
                item.nft_data.forEach((nft: any) => {
                  if (item.contract_address && nft.token_id && nft.external_data) {
                    let balanceString: any = {};
                    balanceString.context = this.context;
                    balanceString.contextType = this.context.split(':')[0];
                    balanceString.collection = item.contract_name;
                    balanceString.caip = `${chain}/erc721:${item.contract_address}:${nft.token_id}`;
                    balanceString.tokenId = nft.token_id;
                    balanceString.image = nft.external_data.image;
                    balanceString.pubkey = address;
                    balanceString.ticker = item.contract_ticker_symbol;
                    balanceString.ref = balanceString.context + balanceString.caip;
                    balanceString.identifier = 'unsupported';
                    balanceString.networkId = chain;
                    balanceString.symbol = item.contract_ticker_symbol;
                    balanceString.type = 'nft';
                    balanceString.balance = item.balance || 1;
                    balanceString.priceUsd = item.floor_price_quote || 0;
                    balanceString.valueUsd = item.floor_price_quote || 0;
                    balanceString.updated = new Date().getTime();
                    if (!item.is_spam) {
                      NFTs.push(balanceString);
                    }
                  }
                });
              }
            });
          } else {
            //console.log('No items found in result.');
          }
        });

        //console.log('NFTs: ', NFTs);
        this.nfts = NFTs;

        // Fetch portfolio
        let portfolio = await this.pioneer.GetPortfolio({ address });
        //console.log(tag, 'portfolio: ', portfolio);
        //console.log(tag, 'portfolio: ', JSON.stringify(portfolio));

        // Process portfolio tokens
        let balances = await Promise.all(
          portfolio.data.tokens.map(async (token) => {
            if (token.assetCaip && token.networkId) {
              // Get asset info
              let assetInfo = this.assetsMap.get(token.assetCaip);
              //console.log(tag, 'assetInfo: ', assetInfo);
              let success = false;
              if (!assetInfo) {
                token.chart = 'zapper';
                success = await this.addAsset(token.assetCaip, token);
              }
              if (success) {
                let assetInfo = this.assetsMap.get(token.assetCaip);
                let balanceString: any = {};
                balanceString.context = this.context;
                balanceString.contextType = this.context.split(':')[0];
                balanceString.name = token.token.coingeckoId;
                balanceString.caip = token.assetCaip;
                balanceString.icon = assetInfo.icon;
                balanceString.pubkey = address;
                balanceString.ticker = token.token.symbol;
                balanceString.ref = balanceString.context + balanceString.caip;
                // balanceString.identifier = caipToThorchain(balanceString.caip, balanceString.ticker);
                //console.log(tag, 'token.networkId: ', token.networkId);
                if (token.networkId && token.networkId.includes('/')) {
                  token.networkId = token.networkId.split('/')[0];
                }
                balanceString.networkId = token.networkId;
                balanceString.symbol = token.token.symbol;
                balanceString.type = 'token';
                balanceString.balance = token.token.balance.toString();
                balanceString.priceUsd = token.token.price || 0;
                balanceString.valueUsd = token.token.balanceUSD;
                balanceString.updated = new Date().getTime();
                return balanceString;
              } else {
                console.error('unknown token: ', token.assetCaip);
                return null;
              }
            }
            return null;
          }),
        );

        balances = balances.filter(Boolean); // Filter out null values

        //console.log(tag, 'NFTs: ', NFTs);
        //console.log(tag, 'TOKEN balances: ', balances);
        let allBalances = [...NFTs, ...balances, ...this.balances];
        //console.log(tag, 'Final: balances: ', balances.length);
        // this.addBalances(allBalances);
        this.balances = allBalances;
        //console.log(tag, 'this.balances: ', this.balances);
        this.events.emit('SET_BALANCES', this.balances);

        return allBalances;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.refresh = async function () {
      const tag = `${TAG} | refresh | `;
      try {
        //log.info(tag, "walletWithContext: ", walletWithContext);
        return true;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setContext = async function (context: string) {
      const tag = `${TAG} | setContext | `;
      try {
        this.context = context;
        this.contextType = context.split(':')[0];
        this.events.emit('SET_CONTEXT', context);
        return { success: true };
      } catch (e) {
        console.error(tag, e);
        throw e;
      }
    };
    this.setContextType = async function (contextType: WalletOption) {
      const tag = `${TAG} | setContextType | `;
      try {
        this.contextType = contextType;
        this.events.emit('SET_CONTEXT_TYPE', contextType);
        return { success: true };
      } catch (e) {
        console.error(tag, e);
        throw e;
      }
    };
    this.setAssetContext = async function (asset?: any) {
      const tag = `${TAG} | setAssetContext | `;
      try {
        let output: any = { success: false, message: 'Failed to set asset context!' };
        // Accept null
        if (!asset) {
          this.assetContext = null;
          return;
        }

        if (!asset.caip) throw Error('Invalid Asset! missing caip!');

        // Try to find the asset in the local assetsMap
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());

        // If the asset is not found, create a placeholder object
        if (!assetInfo) {
          console.log(tag, 'Discovery!: ', asset);

          // Attempt to get the asset from Pioneer (or any external source)
          let pioneerAssetInfo = await this.pioneer.AssetByCaip({ caip: asset.caip });
          assetInfo = pioneerAssetInfo?.data?.length > 0 ? pioneerAssetInfo.data[0] : null;

          if (!assetInfo) {
            // Create a placeholder asset if it's not found in Pioneer or locally
            assetInfo = {
              chain: asset.chain || asset.name || 'Unknown Chain',
              identifier: asset.identifier || asset.name || 'UNKNOWN.ASSET',
              decimals: asset.decimals || 18,
              type: asset.caip.includes('eip155') ? 'evm' : asset.type || 'unknown',
              networkId: asset.caip.split('/')[0],
              caip: asset.caip,
              symbol: asset.symbol || 'UNKNOWN',
              sourceList: asset.sourceList || 'placeholder',
              assetId: asset.assetId || asset.caip,
              chainId: asset.chainId || asset.caip.split('/')[0],
              name: asset.name || 'Unknown Asset',
              networkName: asset.networkName || 'Unknown Network',
              precision: asset.precision || 18,
              color: asset.color || '#000000',
              icon: asset.icon || 'https://pioneers.dev/coins/ethereum.png',
              explorer: asset.explorer || '', // Fill with blank if unknown
              explorerAddressLink: asset.explorerAddressLink || asset.explorer + '/address/', // Fill in the explorer link if available
              explorerTxLink: asset.explorerTxLink || asset.explorer + '/tx/', // Fill in transaction explorer link if available
              relatedAssetKey: asset.caip,
              integrations: [],
              providers: asset.providers,
              pubkeys: [], // Set later
              balances: [], // Set later
              infoCoincap: {}, // Empty for now, can be set later
              infoCoingecko: {}, // Empty for now, can be set later
              priceUsd: asset.priceUsd || 0, // Default to 0 if no data
            };
            //TODO: Add asset to discovery
            // try {
            //   this.pioneer.AddAssetToDiscovery(assetInfo);
            // } catch (e) {
            //   console.error(tag, 'Error adding asset to discovery: ', e);
            // }
            // Add asset to assetsMap and DB if it's missing
            this.assetsMap.set(asset.caip.toLowerCase(), assetInfo);
            output = { success: true, message: 'Asset added to discovery!', discovery: true };
          }
          this.events.emit('ADD_ASSET_DISCOVERY', assetInfo);
          console.log(tag, 'Asset info (placeholder if missing):', assetInfo);
        }

        // Find related pubkeys
        let networkId = assetInfo.networkId;
        if (networkId.includes('eip155')) networkId = 'eip155:*';
        let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes(networkId));
        assetInfo.pubkeys = pubkeys;

        //
        if (networkId.includes('eip155')) {
          //get providers for caip
          let chainId = asset.caip.split('/')[0].split(':')[1]; // This will get the "1" or "123" part of "eip155:1/slip44:60"
          console.log(tag, 'chainId: ', chainId);
          try {
            let providers = await this.pioneer.GetEvmNode({chainId});
            assetInfo.providers = providers?.data?.network;
          } catch (e) {
            console.error('Missing providers for chainId: ', chainId);
          }
        }

        // Find related balances
        let balances = this.balances.filter((b: any) => b.caip === assetInfo.caip);
        assetInfo.balances = balances;

        try {
          // Get marketInfo for asset, optional: can skip if market info is not needed
          let priceData = await this.pioneer.MarketInfo({
            caip: assetInfo.caip.toLowerCase(),
          });
          priceData = priceData?.data || {};
          assetInfo = { ...assetInfo, ...priceData };
        } catch (e) {
          console.error(tag, 'Error getting market info: ', e);
        }

        console.log(tag, 'Final assetInfo: ', assetInfo);
        this.events.emit('SET_ASSET_CONTEXT', assetInfo);
        this.assetContext = assetInfo;
        output = { success: true, message: 'Asset context set!', asset: assetInfo };
        return output;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    // this.setAssetContext = async function (asset?: any) {
    //   const tag = `${TAG} | setAssetContext | `;
    //   try {
    //     //accept null
    //     if (!asset) {
    //       this.assetContext = null;
    //       return;
    //     }
    //     if (!asset.caip) throw Error('Invalid Asset! missing caip!');
    //     let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
    //     if (!assetInfo) {
    //       console.log(tag, 'Discovery!: ', asset);
    //       //get asset from pioneer
    //       let assetInfo = await this.pioneer.AssetByCaip({ caip: asset.caip });
    //       console.log(tag, assetInfo.data);
    //       if (assetInfo.data.length === 0) {
    //       }
    //
    //       //if missing add to pioneer
    //       //add to local assetsMap
    //       //add to db
    //       //TODO Query Pioneer for asset info
    //       //throw Error('Invalid Asset! not found in assetsMap! caip: ' + asset.caip);
    //     }
    //     //console.log(tag, 'assetInfo: ', assetInfo);
    //
    //     //find related pubkeys
    //     let networkId = assetInfo.networkId;
    //     if (networkId.includes('eip155')) networkId = 'eip155:*';
    //     let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes(networkId));
    //     assetInfo.pubkeys = pubkeys;
    //
    //     //find related nodes
    //     let balances = this.balances.filter((b: any) => b.caip === assetInfo.caip);
    //     assetInfo.balances = balances;
    //
    //     //get marketInfo for asset
    //     let priceData = await this.pioneer.MarketInfo({
    //       caip: assetInfo.caip.toLowerCase(),
    //     });
    //     priceData = priceData.data;
    //     assetInfo = { ...assetInfo, ...priceData };
    //
    //     console.log(tag, 'assetInfo: ', assetInfo);
    //     this.events.emit('SET_ASSET_CONTEXT', assetInfo);
    //     this.assetContext = assetInfo;
    //     return { success: true };
    //   } catch (e) {
    //     console.error(tag, 'e: ', e);
    //     throw e;
    //   }
    // };
    this.setOutboundAssetContext = async function (asset?: any) {
      const tag = `${TAG} | setOutputAssetContext | `;
      try {
        //console.log(tag, 'asset: ', asset);
        //accept null
        if (!asset) {
          this.outboundAssetContext = null;
          return;
        }
        if (!asset.caip) throw Error('Invalid Asset! missing caip!');
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
        if (!assetInfo) return { success: false, error: 'caip not found! caip: ' + asset.caip };
        //console.log(tag, 'assetInfo: ', assetInfo);

        //find related pubkeys
        let networkId = assetInfo.networkId;
        if (networkId.includes('eip155')) networkId = 'eip155:*';
        let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes('eip155:*'));
        assetInfo.pubkeys = pubkeys;

        //find related nodes
        let balances = this.balances.filter((b: any) => b.caip === assetInfo.caip);
        assetInfo.balances = balances;

        //get marketInfo for asset
        let priceData = await this.pioneer.MarketInfo({
          caip: assetInfo.caip.toLowerCase(),
        });
        priceData = priceData.data;
        assetInfo = { ...assetInfo, ...priceData };

        this.events.emit('SET_OUTBOUND_ASSET_CONTEXT', assetInfo);
        this.outboundAssetContext = assetInfo;
        return { success: true };
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
  }
}

export default SDK;
