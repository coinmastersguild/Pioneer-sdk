import { derivationPathToString } from '@pioneer-platform/helpers';
import { NetworkDerivationPath } from '@coinmasters/types';
// @ts-expect-error
import coininfo from 'coininfo';

import { getWalletFormatFor } from '../helpers/derivationPath.ts';
import { UTXOLedgerInterface } from '../interfaces/LedgerInterfaces.ts';

export class LitecoinLedger extends UTXOLedgerInterface {
  constructor(paths) {
    super();
    this.paths = paths;
    this.addressNetwork = coininfo.litecoin.main.toBitcoinJS();
    this.chain = 'ltc';
    this.derivationPath = derivationPathToString(NetworkDerivationPath.LTC);
    this.walletFormat = getWalletFormatFor(this.derivationPath) as 'legacy' | 'bech32' | 'p2sh';
  }
}
