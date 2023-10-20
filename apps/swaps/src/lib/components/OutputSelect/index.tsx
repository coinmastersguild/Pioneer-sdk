/* eslint-disable react-hooks/exhaustive-deps */
/*
    Asset Select
      -Highlander
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { Search2Icon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { useEffect, useState } from 'react';

import { usePioneer } from '../../context/Pioneer';

export default function OutputSelect({ onClose }: any) {
  const { state } = usePioneer();
  const { app, balances } = state;
  const [currentPage, setCurrentPage] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showOwnedAssets, setShowOwnedAssets] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const itemsPerPage = 6;
  const cardWidth = useBreakpointValue({ base: '90%', md: '60%', lg: '40%' });

  const handleSelectClick = async (asset: any) => {
    try {
      app.setOutboundAssetContext(asset);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  // const onSearch = async function (searchQuery: string) {
  //   try {
  //     if (!api) {
  //       alert("Failed to init API!");
  //       return;
  //     }
  //     // console.log("searchQuery: ", searchQuery);
  //     const search = {
  //       limit: itemsPerPage,
  //       skip: currentPageIndex * itemsPerPage, // Use currentPageIndex for pagination
  //       collection: "assets",
  //       searchQuery,
  //       searchFields: ["name", "symbol"],
  //     };
  //
  //     const info = await api.SearchAtlas(search);
  //     const currentPageData = info.data.results;
  //     setCurrentPage(currentPageData);
  //     setTotalAssets(info.data.total); // Update total assets count
  //   } catch (e) {
  //     console.error(e);
  //   }
  // };

  const fetchPage = async () => {
    try {
      if (balances) {
        setShowOwnedAssets(true);
        setCurrentPage(balances);
        // load balances
        console.log('balances: ', balances);
        // setCurrentPage(currentPageData);
        setTotalAssets(balances.length); // Update total assets count
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [balances]);

  return (
    <Stack spacing={4}>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Search2Icon color="gray.300" />
        </InputLeftElement>
        <Input
          onChange={() => {
            setTimeout(() => {
              setCurrentPageIndex(0); // Reset pageIndex when searching
              // onSearch(e.target.value || "");
            }, 1000);
          }}
          placeholder="Bitcoin..."
          type="text"
        />
      </InputGroup>
      <Box>
        <Text fontSize="2xl">Total Assets: {totalAssets}</Text>
        <Checkbox isChecked={showOwnedAssets} onChange={() => setShowOwnedAssets(!showOwnedAssets)}>
          Show only owned assets
        </Checkbox>
        {currentPage.map((asset: any) => (
          <Box key={asset.name}>
            <Card>
              <CardBody>
                <HStack
                  alignItems="center"
                  borderRadius="md"
                  boxShadow="sm"
                  maxW={cardWidth}
                  p={5}
                  spacing={4}
                  width="100%"
                >
                  <Avatar
                    size="xl"
                    src={`https://pioneers.dev/coins/${COIN_MAP_LONG[asset?.chain]}.png`}
                  />

                  <Box>
                    <Text fontSize="md">Asset: {asset?.name}</Text>
                    <Text fontSize="md">Network: {asset?.chain}</Text>
                    <Text fontSize="md">Symbol: {asset?.chain}</Text>
                    <Text fontSize="md">Balance: {asset?.assetValue.toString()} </Text>
                  </Box>
                </HStack>
                <HStack mt={2} spacing={2}>
                  <Button onClick={() => handleSelectClick(asset)} size="sm" variant="outline">
                    Select
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          </Box>
        ))}
      </Box>
      <HStack mt={4}>
        <Button
          isDisabled={currentPageIndex === 0}
          onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
        >
          Previous Page
        </Button>
        <Button
          isDisabled={currentPage.length < itemsPerPage}
          onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
        >
          Next Page
        </Button>
      </HStack>
    </Stack>
  );
}
