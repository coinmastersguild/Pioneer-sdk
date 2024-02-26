import { Button, Link } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import NextLink from 'next/link';

import { usePioneer } from '../../context';

const Pending = ({ onClose }: any) => {
  const { createTx, readTx } = usePioneer();
  const [pendingTransactions, setPendingTransactions] = useState<string[]>([]);

  let getTxs = async function () {
    try {
      // Retrieve and parse data from local storage
      let storedData: any = localStorage.getItem('pendingTransactions');
      if (storedData && storedData.length > 0) {
        setPendingTransactions(JSON.parse(storedData));
        //get txs
        let txs: any = await readTx();
        console.log('txs: ', txs);
        if (!txs || txs.length === 0) {
          //create from local storage
          storedData = JSON.parse(storedData);
          console.log('storedData: ', storedData);
          let newTx = {
            status: 'pending',
            txid: storedData[0],
          }
          console.log('newTx: ', newTx);
          let txs = await createTx(newTx);
          console.log('txs: ', txs);
        }
      }
    } catch (e) {
      console.log('error: ', e);
    }
  };

  useEffect(() => {
    getTxs();
  }, []);

  const handleMark = (txId: string, status: 'success' | 'failed') => {
    // Remove the transaction from the list
    const updatedTransactions = pendingTransactions.filter((tx) => tx !== txId);

    // Update state and local storage
    setPendingTransactions(updatedTransactions);
    localStorage.setItem('pendingTransactions', JSON.stringify(updatedTransactions));

    // Optionally, handle additional logic based on the status
    console.log(`Transaction ${txId} marked as ${status}`);
    onClose();
  };

  return (
    <div>
      {pendingTransactions.map((txId, index) => (
        <div key={index}>
          <Link as={NextLink} href={`/intent/track:${txId}`}>
            View Transaction {txId}
          </Link>
          <Button onClick={() => getTxs()}>refresh</Button>
          {/*<Button onClick={() => handleMark(txId, 'success')}>Mark Success</Button>*/}
          {/*<Button onClick={() => handleMark(txId, 'failed')}>Mark Failed</Button>*/}
        </div>
      ))}
    </div>
  );
};

export default Pending;
