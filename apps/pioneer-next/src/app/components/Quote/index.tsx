import { ArrowForwardIcon, CopyIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Stack,
  Text,
  useClipboard,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { NetworkIdToChain } from '@coinmasters/types';
// @ts-ignore
import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import React, { useCallback } from 'react';

import ChangellyImage from '../../assets/png/changelly.png';
import MayachainImage from '../../assets/png/mayachain.png';
import OsmosisImage from '../../assets/png/osmosis.png';
import ThorswapImage from '../../assets/png/thorswap.png';

const Quote = ({ quote, onAcceptSign }: any) => {
  // Use actual values and image paths as needed
  const topBarBg = useColorModeValue('gray.100', 'gray.700'); // Change this color to match your design
  const { hasCopied, onCopy } = useClipboard(quote.quote.id);
  const toast = useToast();

  const integrationImages: { [key: string]: string } = {
    thorswap: ThorswapImage,
    changelly: ChangellyImage,
    mayachain: MayachainImage,
    osmosis: OsmosisImage,
  };

  const getAssetAvatar = (asset: string) => {
    const networkId = caipToNetworkId(asset);
    return `https://pioneers.dev/coins/${COIN_MAP_LONG[NetworkIdToChain[networkId]]}.png`;
  };

  const handleCopy = useCallback(() => {
    onCopy();
    toast({
      title: 'ID Copied',
      description: `Quote ID ${quote.quote.id} has been copied to clipboard.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [onCopy, toast, quote.quote.id]);

  const formatUSD = (amount: number) => `$${amount.toFixed(2)}`;
  function formatNumber(value: string): string {
    const number = parseFloat(value);
    let formattedNumber: string;

    if (number < 1) {
      // For small numbers, use toPrecision with up to 5 significant digits
      formattedNumber = number.toPrecision(5);
    } else {
      // Determine the number of decimal places based on the size of the number
      let decimalPlaces = 2;
      if (number >= 1000 && number < 10000) {
        decimalPlaces = 1;
      } else if (number >= 10000) {
        decimalPlaces = 0;
      }

      // Format the number with commas and the determined decimal places
      formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(number);
    }

    return formattedNumber;
  }

  const handleSignTransaction = useCallback(() => {
    // Placeholder function for signing transaction
    console.log('Transaction Signing Process Initiated');
    onAcceptSign();
    // Implement the actual sign transaction logic here
  }, []);

  const bg = useColorModeValue('white', 'gray.800');
  return (
    <Box bg={bg} borderRadius="lg" boxShadow="md" p={5}>
      <VStack align="stretch" spacing={4}>
        <Flex alignItems="center" justifyContent="space-between">
          {/*<IconButton aria-label="Back" icon={<ChevronLeftIcon />} variant="ghost" />*/}
          <Text fontSize="lg" fontWeight="bold">
            Your ID: {quote.quote.id}
          </Text>
          <Button colorScheme="blue" leftIcon={<CopyIcon />} onClick={handleCopy}>
            {hasCopied ? 'Copied' : 'Copy ID'}
          </Button>
          {/*<IconButton aria-label="Close" icon={<CloseIcon />} variant="ghost" />*/}
        </Flex>

        {/* Triple top bar */}
        <Grid bg={topBarBg} gap={6} p={3} templateColumns="repeat(3, 1fr)">
          <Box h="12" textAlign="center" w="100%">
            <Text fontSize="sm">Deposit This</Text>
            <Flex align="center" justifyContent="flex-end">
              <Text isTruncated mr={2}>
                {`${formatNumber(quote.quote.sellAmount)} (${formatUSD(
                  quote.quote.sellAssetValueUsd,
                )} USD)`}
              </Text>
              {/*<Avatar size="xs" src={getAssetAvatar(quote.quote.sellAsset)} />*/}
            </Flex>
          </Box>
          <Box h="12" textAlign="center" w="100%">
            <Text fontSize="sm">To Get This</Text>
            <Flex align="center" justifyContent="flex-end">
              <Text isTruncated mr={2}>
                {`${formatNumber(quote.quote.buyAmount)} (${formatUSD(
                  quote.quote.buyAssetValueUsd,
                )} USD)`}
              </Text>
              {/*<Avatar size="xs" src={getAssetAvatar(quote.quote.buyAsset)} />*/}
            </Flex>
          </Box>
          <Box h="12" textAlign="center" w="100%">
            <Avatar src={integrationImages[quote.integration.toLowerCase()]} />
          </Box>
        </Grid>

        {/* Main content */}
        {/* Asset and Transaction Information */}
        <Grid alignItems="center" gap={2} templateColumns="repeat(5, 1fr)">
          <Box gridColumnEnd={2} gridColumnStart={1} textAlign="center">
            <Avatar size="md" src={getAssetAvatar(quote.quote.sellAsset)} />
          </Box>
          <Box gridColumnEnd={4} gridColumnStart={3} textAlign="center">
            <ArrowForwardIcon h={8} w={8} />
          </Box>
          <Box gridColumnEnd={6} gridColumnStart={5} textAlign="center">
            <Avatar size="md" src={getAssetAvatar(quote.quote.buyAsset)} />
          </Box>
        </Grid>
        <VStack align="stretch" spacing={4}>
          <HStack alignItems="center" justifyContent="space-between" />

          <Stack direction={{ base: 'column', md: 'row' }} justifyContent="space-between">
            <Badge borderRadius="full" colorScheme="blue" p={2}>
              <Text fontSize="md">
                PRO earned: {formatNumber(quote.quote.proTokenEarned)} (
                {formatUSD(quote.quote.proTokenEarned)} USD)
              </Text>
            </Badge>
          </Stack>

          <Flex align="center" justify="center">
            <Badge borderRadius="full" colorScheme="green" p={2}>
              <HStack spacing={2}>
                <Text fontSize="md">I agree to the Terms</Text>
              </HStack>
            </Badge>
          </Flex>

          <Button isFullWidth colorScheme="blue" onClick={handleSignTransaction}>
            Sign Transaction
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Quote;
