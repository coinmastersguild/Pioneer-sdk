import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
// import { BigNumber } from '@ethersproject/bignumber';
// import { serialize } from '@ethersproject/transactions';
// import { derivationPathToString } from '@pioneer-platform/helpers';
import type { Chain, DerivationPathArray } from '@coinmasters/types';
import { ChainToChainId } from '@coinmasters/types';
import type { EVMTxParams } from '@coinmasters/toolbox-evm';
// import TrezorConnect from '@trezor/connect-web';
import { AbstractSigner, type JsonRpcProvider, type Provider } from 'ethers';

interface KeepKeyEVMSignerParams {
  sdk: any;
  chain: Chain;
  derivationPath: DerivationPathArray;
  provider: Provider | JsonRpcProvider;
}

class KeepKeySigner extends AbstractSigner {
  private sdk: any;
  private chain: Chain;
  private derivationPath: DerivationPathArray;
  private address: string;
  readonly provider: Provider | JsonRpcProvider;

  constructor({ sdk, chain, derivationPath, provider }: KeepKeyEVMSignerParams) {
    super();
    this.sdk = sdk;
    this.chain = chain;
    this.derivationPath = derivationPath;
    this.provider = provider;
    this.address = '';
  }

  getAddress = async () => {
    if (!this.address) {
      //ETH path
      let addressInfo = {
        addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
        coin: 'Ethereum',
        scriptType: 'ethereum',
        showDisplay: false,
      };
      let response = await this.sdk.address.ethereumGetAddress({
        address_n: addressInfo.addressNList,
      });
      this.address = response.address;
    }

    return this.address;
  };

  signMessage = async (message: string) => {
    let input = {
      address: this.address,
      message: message, //must be hex encoded
    };
    let response = await this.sdk.ethSign(input);
    return response;
  };

  // @TODO: implement signTypedData
  signTypedData(): Promise<string> {
    throw new Error('this method is not implemented');
  }
  
  signTransaction = async ({ from, to, value, gasLimit, nonce, data, ...restTx }: EVMTxParams) => {
    if (!from) throw new Error('Missing from address');
    if (!to) throw new Error('Missing to address');
    if (!gasLimit) throw new Error('Missing gasLimit');
    if (!nonce) throw new Error('Missing nonce');
    if (!data) throw new Error('Missing data');
    if (!restTx) throw new Error('Missing restTx');
    const isEIP1559 = 'maxFeePerGas' in restTx && 'maxPriorityFeePerGas' in restTx;

    const baseTx = {
      addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
      from: this.address,
      chainId: BigNumber.from(ChainToChainId[this.chain]).toHexString(),
      to,
      value: BigNumber.from(value || 0).toHexString(),
      gasLimit: BigNumber.from(gasLimit).toHexString(),
      nonce: BigNumber.from(
        nonce || (await this.provider.getTransactionCount(from, 'pending')),
      ).toHexString(),
      data,
      ...(isEIP1559
        ? {
            maxFeePerGas: BigNumber.from(restTx?.maxFeePerGas).toHexString(),
            maxPriorityFeePerGas: BigNumber.from(restTx.maxPriorityFeePerGas).toHexString(),
          }
        : //@ts-expect-error ts cant infer type of restTx
          { gasPrice: BigNumber.from(restTx.gasPrice).toHexString() }),
    };

    let responseSign = await this.sdk.eth.ethSignTransaction(baseTx);
    return responseSign.serialized;
  };

  connect = (provider: Provider) =>
    new KeepKeySigner({
      sdk: this.sdk,
      chain: this.chain,
      derivationPath: this.derivationPath,
      provider,
    });
}
export const getEVMSigner = async ({ sdk, chain, derivationPath, provider }: any) =>
  new KeepKeySigner({ sdk, chain, derivationPath, provider });