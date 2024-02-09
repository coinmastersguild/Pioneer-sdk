import { Box, Button, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import KeepKey from '../../components/KeepKey';
import Ledger from '../../components/Ledger';
import MetaMask from '../../components/MetaMask';
import { usePioneer } from '../../context';
import { getWalletContent } from '../WalletIcon';

export default function WalletList() {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const { state } = usePioneer();
  const { app } = state;

  useEffect(() => {
    try {
      const storedWallets = localStorage.getItem('pairedWallets');
      if (storedWallets) {
        setWallets(JSON.parse(storedWallets));
      }
    } catch (e) {
      console.error('Failed to load wallets from local storage:', e);
    }
  }, []);

  const handleWalletSelect = (wallet: any) => {
    try {
      console.log('wallet: ', wallet);
      console.log('wallet: ', wallet.split(':')[0]);
      setSelectedWallet(wallet.split(':')[0]);
      app.setContext(wallet);
      // Load public keys and balances as needed
    } catch (e) {
      console.error(e);
    }
  };

  const renderWalletDetails = (wallet: any) => {
    console.log('renderWalletDetails: ', wallet);

    switch (wallet) {
      case 'keepkey':
        return <KeepKey />;
      case 'ledger':
        return <Ledger />;
      case 'metamask':
        return <MetaMask />;
      // Add more cases as needed for different wallet types
      default:
        return <Text>No specific details available for this wallet type.</Text>;
    }
  };

  if (selectedWallet) {
    // If a wallet is selected, render its details
    return <div>{renderWalletDetails(selectedWallet)}</div>;
  }

  // Render the list of wallets if none is selected
  return (
    <div>
      {wallets.map((wallet: any, index: any) => (
        <Box key={index}>
          <Flex alignItems="center" bg="black" borderRadius="md" boxShadow="sm" padding={2}>
            {getWalletContent(wallet.split(':')[0])}
            <Box ml={3}>
              <Text fontSize="sm">wallet: {wallet}</Text>
            </Box>
            <Button
              ml="auto"
              onClick={() => handleWalletSelect(wallet)}
              size="sm"
              variant="outline"
            >
              Select
            </Button>
          </Flex>
        </Box>
      ))}
    </div>
  );
}
