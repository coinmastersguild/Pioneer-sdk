import {
  ARBToolbox,
  AVAXToolbox,
  BASEToolbox,
  BSCToolbox,
  ETHToolbox,
  getProvider,
  MATICToolbox,
  OPToolbox,
} from '@coinmasters/toolbox-evm';
import type { EVMChain } from '@coinmasters/types';
import { Chain, WalletOption } from '@coinmasters/types';
import { KeepKeySdk } from '@keepkey/keepkey-sdk';

import { binanceWalletMethods } from './chains/binance.js';
import { cosmosWalletMethods } from './chains/cosmos.js';
import { KeepKeySigner } from './chains/evm.ts';
import { mayachainWalletMethods } from './chains/mayachain.ts';
import { osmosisWalletMethods } from './chains/osmosis.js';
import { rippleWalletMethods } from './chains/ripple.js';
import { thorchainWalletMethods } from './chains/thorchain.ts';
import { utxoWalletMethods } from './chains/utxo.js';
export type { PairingInfo } from '@keepkey/keepkey-sdk';

export const KEEPKEY_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.Binance,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Optimism,
  Chain.Osmosis,
  Chain.Polygon,
  Chain.Ripple,
  Chain.THORChain,
  Chain.Mayachain,
  Chain.Zcash,
] as const;

/*
 * KeepKey Wallet
 */
type KeepKeyOptions = {
  sdk: KeepKeySdk;
  apiClient?: any;
  rpcUrl?: string;
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  covalentApiKey?: string;
  chain: Chain;
  paths?: any;
};

const getEVMWalletMethods = async ({
  api,
  sdk,
  chain,
  ethplorerApiKey,
  covalentApiKey,
  rpcUrl,
  derivationPath = [2147483692, 2147483708, 2147483648, 0, 0],
}: any) => {
  const provider = getProvider(chain as EVMChain, rpcUrl);
  const signer = new KeepKeySigner({ sdk, chain, derivationPath, provider });
  const address = await signer.getAddress();
  const evmParams = { api, signer, provider };

  switch (chain) {
    case Chain.Ethereum:
      return {
        ...ETHToolbox({ ...evmParams, ethplorerApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.BinanceSmartChain:
      return {
        ...BSCToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Arbitrum:
      return {
        ...ARBToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Optimism:
      return {
        ...OPToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Polygon:
      return {
        ...MATICToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Avalanche:
      return {
        ...AVAXToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Base:
      return {
        ...BASEToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    default:
      throw new Error('getEVMWalletMethods Chain not supported');
  }
};

const getToolbox = async ({
  sdk,
  apiClient,
  rpcUrl,
  chain,
  covalentApiKey,
  ethplorerApiKey,
  utxoApiKey,
  paths,
}: KeepKeyOptions) => {
  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.Ethereum: {
      if (chain === Chain.Ethereum && !ethplorerApiKey)
        throw new Error('Ethplorer API key not found');
      if (chain !== Chain.Ethereum && !covalentApiKey)
        throw new Error('Covalent API key not found');
      const walletMethods = await getEVMWalletMethods({
        sdk,
        apiClient,
        chain,
        covalentApiKey,
        derivationPath: [2147483692, 2147483708, 2147483648, 0, 0],
        ethplorerApiKey,
        rpcUrl,
      });

      return { address: walletMethods.getAddress(), walletMethods };
    }
    case Chain.Binance: {
      const walletMethods = await binanceWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Cosmos: {
      const walletMethods = await cosmosWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Osmosis: {
      const walletMethods = await osmosisWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.THORChain: {
      const walletMethods = await thorchainWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Mayachain: {
      const walletMethods = await mayachainWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Ripple: {
      const walletMethods = await rippleWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Zcash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const walletMethods = await utxoWalletMethods({
        apiKey: utxoApiKey,
        paths,
        apiClient,
        sdk,
        chain,
      });
      return { address: walletMethods.getAddress(), walletMethods };
    }
    default:
      throw new Error('KeepKey Chain not supported ' + chain);
  }
};

export const checkKeepkeyAvailability = async (spec: string) => {
  try {
    const response = await fetch(spec);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return false;
};

// kk-sdk docs: https://medium.com/@highlander_35968/building-on-the-keepkey-sdk-2023fda41f38
// test spec: if offline, launch keepkey-bridge
let attempt = 0;
const checkAndLaunch = async () => {
  attempt++;
  if (!(await checkKeepkeyAvailability('http://localhost:1646/spec/swagger.json'))) {
    if (attempt === 3) {
      alert(
        'KeepKey desktop is required for keepkey-sdk, please go to https://keepkey.com/get-started',
      );
    } else {
      window.location.assign('keepkey://launch');
      await new Promise((resolve) => setTimeout(resolve, 30000));
      checkAndLaunch();
    }
  }
};

const connectKeepkey =
  ({
    apis,
    rpcUrls,
    addChain,
    config: { keepkeyConfig, covalentApiKey, ethplorerApiKey, utxoApiKey },
  }) =>
  async (chains, paths) => {
    if (!keepkeyConfig) throw new Error('KeepKey config not found');
    //console.log('paths: ', paths);
    //console.log('apis: ', apis);
    //console.log('rpcUrls: ', rpcUrls);
    //console.log('addChain: ', addChain);
    //console.log('config: ', { keepkeyConfig, covalentApiKey, ethplorerApiKey, utxoApiKey });

    //console.log('connectKeepkey chains: ', chains);
    await checkAndLaunch();

    if (!paths) paths = [];
    // Only build this once for all assets
    const keepKeySdk = await KeepKeySdk.create(keepkeyConfig);
    // console.log('keepKeySdk: ', keepKeySdk);
    let features = await keepKeySdk.system.info.getFeatures();
    // console.log('features: ', features);

    const chainPromises = chains.map(async (chain) => {
      if (!chain) return;

      const chainLogLabel = `Chain ${chain} processing time`;
      // console.time(chainLogLabel);
      // console.log('Processing chain: ', chain);

      // Get paths for chain
      // console.log('paths: ', paths);
      // eslint-disable-next-line eqeqeq
      const filteredPaths = paths.filter((p) => p.symbolSwapKit == chain);
      console.log('filteredPaths: ', filteredPaths.length);
      if (!filteredPaths.length) {
        console.log('No paths found for chain: ', chain);
      }

      const { address, walletMethods } = await getToolbox({
        sdk: keepKeySdk,
        apiClient: apis[chain],
        rpcUrl: rpcUrls[chain],
        chain,
        covalentApiKey,
        ethplorerApiKey,
        utxoApiKey,
        paths: filteredPaths,
      });

      addChain({
        chain,
        info: features,
        walletMethods,
        wallet: { address, balance: [], walletType: WalletOption.KEEPKEY },
        keepkeySdk: keepKeySdk,
      });

      console.timeEnd(chainLogLabel);
    });

    // Wait for all the promises to resolve
    await Promise.all(chainPromises);

    return keepkeyConfig.apiKey;
  };

export const keepkeyWallet = {
  connectMethodName: 'connectKeepkey' as const,
  connect: connectKeepkey,
  isDetected: () => checkKeepkeyAvailability('http://localhost:1646/spec/swagger.json'),
};
