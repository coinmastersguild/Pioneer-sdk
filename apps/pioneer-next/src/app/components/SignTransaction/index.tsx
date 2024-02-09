import {
  Button,
  Card,
  CardHeader,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { FeeOption, WalletOption } from '@coinmasters/types';
// @ts-ignore
import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
import {
  getPaths,
  // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
// @ts-ignore
import { useEffect, useState } from 'react';

// @ts-ignore
import { usePioneer } from '../../context';
// Adjust the import path according to your file structure

export default function SignTransaction({ onClose, quote }: any) {
  const { state, connectWallet } = usePioneer();
  const { app, assetContext, outboundAssetContext } = state;
  // const [totalNetworkFees, setTotalNetworkFees] = useState('');
  // const [inputFeeAsset, setInputFeeAsset] = useState('');
  // const [outputFeeAsset, setOutputFeeAsset] = useState('');
  // const [inputFee, setInputFee] = useState('');
  // const [inputFeeUSD, setInputFeeUSD] = useState('');
  // const [outputFee, setOutputFee] = useState('');
  // const [outputFeeUSD, setOutputFeeUSD] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleSwap = async () => {
    // const inputChain = assetContext?.chain;
    console.log('outboundAssetContext: ', outboundAssetContext);
    const outputChain = outboundAssetContext?.chain;
    if (!assetContext || !outboundAssetContext || !app || !app?.swapKit) return;

    const address = app?.swapKit.getAddress(outputChain);
    console.log('address: ', address);

    console.log('quote: ', quote);
    const txHash = await app?.swapKit.swap({
      route: quote.quote,
      recipient: address,
      feeOptionKey: FeeOption.Fast,
    });
    console.log('txHash: ', txHash);
    setTxhash(txHash);
    onClose();
  };

  const approveTransaction = async () => {
    // verify context of input asset
    const walletInfo = await app.swapKit.getWalletByChain(assetContext.chain);

    if (!walletInfo) {
      setIsPairing(true);
      console.log('assetContext: ', assetContext);
      const contextType = assetContext.context.split(':')[0];
      console.log('contextType: ', contextType);
      //set blockchains to just ETH + tx chain for speed
      let blockchain = caipToNetworkId(quote.quote.sellAsset);
      let blockchains = ['eip155:1', blockchain];
      let paths = getPaths(blockchains);
      let optimized: any = [];
      blockchains.forEach((network: any) => {
        const pathForNetwork = paths
          .filter((path: { network: any }) => path.network === network)
          .slice(-1)[0];
        if (pathForNetwork) {
          optimized.push(pathForNetwork);
        }
      });
      app.setPaths(optimized);
      console.log('blockchain: ', blockchain);
      let pairObj = {
        type:WalletOption.KEEPKEY,
        blockchains
      }
      resultInit = await app.pairWallet(pairObj)
      await app.getPubkeys();
      await app.getBalances();
      setTimeout(() => {
        console.log('Retrying wallet connection...');
        approveTransaction();
      }, 3000);
    } else {
      console.log('Approving TX');
      setIsApproved(true);
      await handleSwap(); // Note: Added 'await' to ensure handleSwap completes before proceeding.
    }
  };

  // start the context provider
  useEffect(() => {
    if (app) console.log('Wallets changed: ', app.wallets);
  }, [app, app?.wallets]);

  // start the context provider
  useEffect(() => {
    setIsPairing(false);
  }, [app, app?.context]);

  // start the context provider
  // useEffect(() => {
  //   setFees();
  // }, [route]);

  // Function to render transaction details as a table
  const renderTxDetails = (data: any) => {
    const renderValue = (value: any): JSX.Element | string => {
      if (Array.isArray(value)) {
        return (
          <ul>
            {value.map((item, index) => (
              <li key={index}>{renderValue(item)}</li>
            ))}
          </ul>
        );
      } else if (typeof value === 'object' && value !== null) {
        return (
          <Table size="sm">
            <Tbody>
              {Object.entries(value).map(([key, val], index) => (
                <Tr key={index}>
                  <Td>{key}</Td>
                  <Td>{renderValue(val)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        );
      } else {
        return value !== null ? value.toString() : '';
      }
    };

    const renderRow = (key: string, value: any) => (
      <Tr key={key}>
        <Td>{key}</Td>
        <Td>{renderValue(value)}</Td>
      </Tr>
    );

    const rows = [];

    for (const key in data) {
      rows.push(renderRow(key, data[key]));
    }

    return (
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Field</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>{rows}</Tbody>
      </Table>
    );
  };

  return (
    <Stack spacing={4}>
      {isPairing ? (
        <div>
          <Spinner size="xl" />
          <Card>
            <CardHeader>
              Pairing and Syncing Wallet... wallet:{assetContext.context} <br />
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div>
          {isApproved ? (
            <div>
              You Must Sign the Transaction on your device! ... <br />
              <Spinner size="xl" />
            </div>
          ) : (
            <div>
              {renderTxDetails(quote)}
              <Button onClick={approveTransaction}>SIGN TRANSACTION</Button>
            </div>
          )}
        </div>
      )}
    </Stack>
  );
}
