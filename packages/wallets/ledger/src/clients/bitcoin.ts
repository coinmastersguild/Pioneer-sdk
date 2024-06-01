import { derivationPathToString } from '@pioneer-platform/helpers';
import { NetworkDerivationPath } from '@coinmasters/types';
import { networks } from 'bitcoinjs-lib';

import { getWalletFormatFor } from '../helpers/derivationPath.ts';
import { UTXOLedgerInterface } from '../interfaces/LedgerInterfaces.ts';

export class BitcoinLedger extends UTXOLedgerInterface {
  constructor(paths: any) {
    super();
    this.paths = paths;
    this.addressNetwork = networks.bitcoin;
    this.chain = 'btc';
    this.derivationPath = derivationPathToString(NetworkDerivationPath.BTC);
    this.walletFormat = getWalletFormatFor(this.derivationPath) as 'legacy' | 'bech32' | 'p2sh';
  }
}
