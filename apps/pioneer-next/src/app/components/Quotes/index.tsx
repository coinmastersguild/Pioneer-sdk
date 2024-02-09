import { Avatar, Box, Button, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { NetworkIdToChain } from '@coinmasters/types';
// @ts-ignore
import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { useEffect, useState } from 'react';

// @ts-ignore
import ChangellyImage from '../../assets/png/changelly.png';
// @ts-ignore
import MayachainImage from '../../assets/png/mayachain.png';
// @ts-ignore
import OsmosisImage from '../../assets/png/osmosis.png';
// interface Quote {
//   integration: string;
//   quote: {
//     amountOut: string;
//     proTokenEarnedUsd: number;
//     sellAssetValueUsd: number;
//     buyAssetValueUsd: number;
//     sellAsset: string;
//     buyAsset: string;
//   };
// }
// Import images with '@ts-ignore' for TypeScript
// @ts-ignore
import ThorswapImage from '../../assets/png/thorswap.png';

const Quotes = ({ onClose, onSelectQuote, Quotes }: any) => {
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);

  useEffect(() => {
    // Fetch quotes logic here
  }, []);

  const integrationImages: { [key: string]: string } = {
    thorswap: ThorswapImage,
    changelly: ChangellyImage,
    mayachain: MayachainImage,
    osmosis: OsmosisImage,
  };

  const integrationColors: { [key: string]: string } = {
    thorswap: '#3c366b', // ThorSwap theme color
    changelly: '#19212d', // Changelly theme color
    mayachain: '#f4b728', // MayaChain theme color
    osmosis: '#00a3ff', // Osmosis theme color
  };

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
        maximumFractionDigits: decimalPlaces
      }).format(number);
    }

    return formattedNumber;
  }

  const handleQuoteSelect = (index: number) => {
    setSelectedQuote(index);
    onSelectQuote(Quotes[index]);
    console.log(`Quote selected: ${Quotes[index].integration}`);
  };

  const getAssetAvatar = (asset: string) => {
    const networkId = caipToNetworkId(asset);
    return `https://pioneers.dev/coins/${COIN_MAP_LONG[NetworkIdToChain[networkId]]}.png`;
  };

  return (
    <VStack spacing={4} w="full">
      <SimpleGrid columns={{ base: 1 }} spacing={5} w="full">
        {Quotes.map((quote, index) => (
          <Box
            as="button"
            onClick={() => handleQuoteSelect(index)}
            bg={integrationColors[quote.integration.toLowerCase()]}
            p={4}
            borderRadius="md"
            shadow="md"
            color="white"
            key={index}
            opacity={selectedQuote === index || selectedQuote === null ? 1 : 0.5}
            transform={selectedQuote === index ? 'scale(1.05)' : 'none'}
            transition="opacity 0.2s, transform 0.2s"
            w="full"
            maxW="4xl"
          >
            <Flex direction="row" justify="space-between" align="center" wrap="wrap">
              <Avatar size={'xl'} src={integrationImages[quote.integration.toLowerCase()]} />
              <VStack align="flex-end" flex="1" minW="0">
                <Text fontWeight="bold" isTruncated>{quote.integration}</Text>
                <Flex align="center" justifyContent="flex-end">
                  <Text isTruncated mr={2}>
                    {`${formatNumber(quote.quote.sellAmount)} (${formatUSD(quote.quote.sellAssetValueUsd)} USD)`}
                  </Text>
                  <Avatar size="xs" src={getAssetAvatar(quote.quote.sellAsset)} />
                </Flex>
                <Flex align="center" justifyContent="flex-end">
                  <Text isTruncated mr={2}>
                    {`${formatNumber(quote.quote.buyAmount)} (${formatUSD(quote.quote.buyAssetValueUsd)} USD)`}
                  </Text>
                  <Avatar size="xs" src={getAssetAvatar(quote.quote.buyAsset)} />
                </Flex>
                <Text isTruncated>PRO: {formatNumber(quote.quote.proTokenEarned)} ({formatUSD(quote.quote.proTokenEarnedUsd)} USD)</Text>
                <Text isTruncated>Total Value OUT: {formatUSD(quote.quote.buyAssetValueUsd + quote.quote.proTokenEarnedUsd)}</Text>
              </VStack>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
      <Flex justify="space-between" w="full">
        <Button onClick={onClose}>Close</Button>
      </Flex>
    </VStack>
  );
};

export default Quotes;
