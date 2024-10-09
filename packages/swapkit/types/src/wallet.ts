import { Chain, EVMChainList } from './network';

export enum WalletOption {
  'KEYSTORE' = 'KEYSTORE',
  'KEEPKEY' = 'KEEPKEY',
  'XDEFI' = 'XDEFI',
  'METAMASK' = 'METAMASK',
  'METAMASK_SHAPESHIFT' = 'METAMASK_SHAPESHIFT',
  'COINBASE_WEB' = 'COINBASE_WEB',
  'TREZOR' = 'TREZOR',
  'TRUSTWALLET_WEB' = 'TRUSTWALLET_WEB',
  'LEDGER' = 'LEDGER',
  'KEPLR' = 'KEPLR',
  'OKX' = 'OKX',
  'BRAVE' = 'BRAVE',
  'WALLETCONNECT' = 'WALLETCONNECT',
}

export type EVMWalletOptions =
  | WalletOption.BRAVE
  | WalletOption.METAMASK
  | WalletOption.TRUSTWALLET_WEB
  | WalletOption.COINBASE_WEB;

// Support Array
const AllChainsSupported = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Osmosis,
  Chain.Ripple,
  Chain.Dogecoin,
  Chain.Dash,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Optimism,
  Chain.Polygon,
  Chain.THORChain,
] as Chain[];

export const availableChainsByWallet: any = {
  [WalletOption.BRAVE]: EVMChainList,
  [WalletOption.COINBASE_WEB]: EVMChainList,
  [WalletOption.KEPLR]: [Chain.Cosmos],
  [WalletOption.KEYSTORE]: [
    Chain.Arbitrum,
    Chain.Base,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  [WalletOption.LEDGER]: AllChainsSupported,
  [WalletOption.TREZOR]: [
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Litecoin,
    Chain.Dogecoin,
    Chain.Ethereum,
  ],
  [WalletOption.KEEPKEY]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Osmosis,
    Chain.Ripple,
    Chain.Dogecoin,
    Chain.Dash,
    Chain.Mayachain,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  [WalletOption.METAMASK_SHAPESHIFT]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  [WalletOption.METAMASK]: EVMChainList,
  [WalletOption.TRUSTWALLET_WEB]: EVMChainList,
  [WalletOption.XDEFI]: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.BitcoinCash,
    Chain.Cosmos,
    Chain.Ripple,
    Chain.Dogecoin,
    Chain.Ethereum,
    Chain.Litecoin,
    Chain.Optimism,
    Chain.Polygon,
    Chain.THORChain,
  ],
  [WalletOption.WALLETCONNECT]: [
    Chain.Ethereum,
    // Chain.BinanceSmartChain,
    // Chain.Avalanche,
  ],
  [WalletOption.OKX]: [
    Chain.Ethereum,
    Chain.Avalanche,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
  ],
};

//prefurred chains for wallets (for large wallets this set help performance)
export const prefurredChainsByWallet: any = {
  [WalletOption.KEEPKEY]: [Chain.Bitcoin, Chain.Ethereum, Chain.Base],
};
