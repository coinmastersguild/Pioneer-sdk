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
import { usePioneer } from '@coinmasters/pioneer-react';

export default function Asset({ onSelect }: any) {
  const { state } = usePioneer();
  let { app, balances } = state;
  const [assets, setAssets] = useState([]);
  const [currentPage, setCurrentPage] = useState([]);
  // const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showOwnedAssets, setShowOwnedAssets] = useState(false);
  // const [totalAssets, setTotalAssets] = useState(0);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  // const itemsPerPage = 6;
  // const cardWidth = useBreakpointValue({ base: "90%", md: "60%", lg: "40%" });

  let onStart  = async function(){
    try{
      console.log("onStart Assets: ")
      //get all slugs
      let allAssets = await app.getAssets();
      console.log('allAssets: ', allAssets);
      console.log('allAssets: ', allAssets.length);
      setAssets(allAssets);
      setCurrentPage(allAssets);
      //get in state

      //allow search

    }catch(e){
      console.error(e)
    }
  }
  useEffect(() => {
    onStart();
  }, [app]);


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

  const fetchPage = async () => {
    try {
      //get


      //TODO mark and priotize balances
      // if (balances) {
      //   setShowOwnedAssets(true);
      //
      //   let balancesView = balances.sort((a: any, b: any) => {
      //     if (sortOrder === 'asc') {
      //       return (a.valueUsd || 0) - (b.valueUsd || 0);
      //     }
      //     return (b.valueUsd || 0) - (a.valueUsd || 0);
      //   });
      //
      //   setCurrentPage(balancesView);
      //   console.log('balancesView: ', balancesView);
      //   //setTotalAssets(balancesView.length);
      // }
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
                src={asset.icon || pioneerImagePng}
              >
                {/*{getWalletBadgeContent(asset?.context.split(':')[0])}*/}
              </Avatar>
              <Box ml={3}>
                <Text fontSize="sm">name: {asset?.name}</Text>
                <Text fontSize="sm">caip: {asset?.caip}</Text>
                <Text fontSize="sm">symbol: {asset?.symbol}</Text>
                <Text fontSize="sm">chain: {asset?.chain}</Text>
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
