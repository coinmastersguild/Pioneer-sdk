import { CheckIcon } from '@chakra-ui/icons'; // Make sure to import the icons you need
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { usePioneer } from '../../context';
import Portfolio from '../Portfolio';

export default function KeepKey({ onClose }: any) {
  const { state, connectWallet } = usePioneer();
  const { app, balances, pubkeys, status } = state;
  const [isSyncing, setIsSyncing] = useState(false);

  let syncWallet = async function () {
    try {
      setIsSyncing(true);
      await connectWallet('KEEPKEY');
      await app.getPubkeys();
      await app.getBalances();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (balances.length > 0) {
      setIsSyncing(false);
    }
  }, [balances]);

  useEffect(() => {
    syncWallet();
  }, [app]);

  // Function to render the success card
  const renderSuccessCard = () => (
    <div>
      <Box
        alignItems="center"
        backgroundColor="green.700"
        borderRadius="lg"
        display="flex"
        mb={4}
        p={4}
      >
        <CheckIcon color="green.500" h={5} mr={2} w={5} />
        <Text>Pairing Successful</Text>
      </Box>
      <Portfolio />
    </div>
  );

  return (
    <div>
      {!isSyncing ? (
        <div>{balances.length > 0 && renderSuccessCard()}</div>
      ) : (
        <div>
          <div>
            <Spinner size="xl" />
            <Text>Syncing your wallet on all Blockchains...</Text>
          </div>
        </div>
      )}
    </div>
  );
}
