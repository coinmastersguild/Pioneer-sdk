import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider, Provider } from '@ethersproject/providers';
import { EVMChain, EVMTxParams } from '@thorswap-lib/types';

import { DEFAULT_EIP155_METHODS } from './constants.js';
import { chainToChainId, getAddressByChain } from './helpers.js';
import { Walletconnect } from './walletconnect.js';

interface WalletconnectEVMSignerParams {
  chain: EVMChain;
  walletconnect: Walletconnect;
  provider: Provider | JsonRpcProvider;
}

class WalletconnectSigner extends Signer {
  private chain: EVMChain;
  private walletconnect: Walletconnect;
  private address: string;
  readonly provider: Provider | JsonRpcProvider;

  constructor({ chain, provider, walletconnect }: WalletconnectEVMSignerParams) {
    super();
    this.chain = chain;
    this.walletconnect = walletconnect;
    this.provider = provider;
    this.address = '';
  }

  getAddress = async () => {
    if (!this.walletconnect) throw new Error('Missing walletconnect');
    if (!this.address) {
      this.address = getAddressByChain(this.chain, this.walletconnect.accounts);
    }

    return this.address;
  };

  signMessage = async (message: string) => {
    // this is probably broken
    const txHash = await this.walletconnect?.client.request({
      chainId: chainToChainId(this.chain),
      topic: this.walletconnect.session.topic,
      request: {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN,
        params: [message],
      },
    });

    return txHash as string;
  };

  signTransaction = async ({ from, to, value, data }: EVMTxParams) => {
    if (!from) throw new Error('Missing from address');
    if (!to) throw new Error('Missing to address');

    const baseTx = {
      from,
      to,
      value: BigNumber.from(value || 0).toHexString(),
      data,
    };

    const txHash = await this.walletconnect?.client.request({
      chainId: chainToChainId(this.chain),
      topic: this.walletconnect.session.topic,
      request: {
        method: DEFAULT_EIP155_METHODS.ETH_SIGN_TRANSACTION,
        params: [baseTx],
      },
    });

    return txHash as string;
  };

  connect = (provider: Provider) =>
    new WalletconnectSigner({
      chain: this.chain,
      walletconnect: this.walletconnect,
      provider,
    });
}
export const getEVMSigner = async ({
  chain,
  walletconnect,
  provider,
}: WalletconnectEVMSignerParams) => new WalletconnectSigner({ chain, walletconnect, provider });