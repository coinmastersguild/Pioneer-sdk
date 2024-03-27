import { ChevronDownIcon, ChevronUpIcon, Search2Icon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
} from '@chakra-ui/react';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { useEffect, useState } from 'react';
import {
  getWalletBadgeContent,
  getWalletContent,
  pioneerImagePng,
} from '../../components/WalletIcon';

export default function AssetSelect({ usePioneer, onSelect }: any) {
  const { state } = usePioneer();
  let { app, balances } = state;
  const [currentPage, setCurrentPage] = useState([]);
  // const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showOwnedAssets, setShowOwnedAssets] = useState(false);
  // const [totalAssets, setTotalAssets] = useState(0);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  // const itemsPerPage = 6;
  // const cardWidth = useBreakpointValue({ base: "90%", md: "60%", lg: "40%" });

  const handleSelectClick = async (asset: any) => {
    try {
      app.setAssetContext(asset);
      onSelect(asset);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchChange = (event: any) => {
    setSearch(event.target.value);
    // setCurrentPageIndex(0);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // const filteredAssets = currentPage
  //   .filter((asset: any) => {
  //     return (
  //       asset?.name?.toLowerCase().includes(search.toLowerCase())
  //     );
  //   })
    // .sort((a: any, b: any) => {
    //   if (sortOrder === 'asc') {
    //     return (a.valueUsd || 0) - (b.valueUsd || 0);
    //   }
    //   return (b.valueUsd || 0) - (a.valueUsd || 0);
    // });

  const fetchPage = async () => {
    try {
      if (balances) {
        setShowOwnedAssets(true);

        let balancesView = balances.sort((a: any, b: any) => {
          if (sortOrder === 'asc') {
            return (a.valueUsd || 0) - (b.valueUsd || 0);
          }
          return (b.valueUsd || 0) - (a.valueUsd || 0);
        });

        setCurrentPage(balancesView);
        console.log('balancesView: ', balancesView);
        //setTotalAssets(balancesView.length);
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
        <Input onChange={handleSearchChange} placeholder="Bitcoin..." type="text" value={search} />
      </InputGroup>
      <Box>
        {/* <Text fontSize="2xl">Total Assets: {totalAssets}</Text> */}
        {/* <Checkbox */}
        {/*  isChecked={showOwnedAssets} */}
        {/*  onChange={() => setShowOwnedAssets(!showOwnedAssets)} */}
        {/* > */}
        {/*  Show only owned assets */}
        {/* </Checkbox> */}
        <Button onClick={toggleSortOrder} size="sm">
          Sort by Value {sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
        <br />
        <br />
        {currentPage.map((asset: any, index: number) => (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={index}>
            <Flex
              alignItems="center"
              bg="black"
              border="1px solid #fff"
              borderRadius="md"
              boxShadow="sm"
              padding={2}
            >
              <Avatar
                size="md"
                src={`https://pioneers.dev/coins/${COIN_MAP_LONG[asset?.chain as keyof typeof COIN_MAP_LONG]}.png`}
              >
                {getWalletBadgeContent(asset?.context.split(':')[0])}
              </Avatar>
              <Box ml={3}>
                <Text fontSize="sm">Asset: {asset?.caip}</Text>
                <Text fontSize="sm">symbol: {asset?.symbol}</Text>
                <Text fontSize="sm">chain: {asset?.chain}</Text>
                <Text fontSize="sm">
                  Value USD:{' '}
                  {typeof asset?.valueUsd === 'string'
                    ? (+asset.valueUsd).toFixed(2).toLocaleString()
                    : ''}
                </Text>
              </Box>
              <Button
                ml="auto"
                onClick={() => handleSelectClick(asset)}
                size="sm"
                variant="outline"
              >
                Select
              </Button>
            </Flex>
          </Box>
        ))}
      </Box>
      <Flex justifyContent="space-between" mt={4}>
        {/* <Button */}
        {/*  isDisabled={currentPageIndex === 0} */}
        {/*  onClick={() => setCurrentPageIndex(currentPageIndex - 1)} */}
        {/* > */}
        {/*  Previous Page */}
        {/* </Button> */}
        {/* <Button */}
        {/*  isDisabled={filteredAssets.length < itemsPerPage} */}
        {/*  onClick={() => setCurrentPageIndex(currentPageIndex + 1)} */}
        {/* > */}
        {/*  Next Page */}
        {/* </Button> */}
      </Flex>
    </Stack>
  );
}
