import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import { usePioneer } from '../../context';
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import MiddleEllipsis from '../../components/MiddleEllipsis';

const TOKEN_PLATFORMS = ['ETH', 'BSC', 'AVAX', 'ARB'];

export default function OutputSelect({ onClose, onSelect }: any) {
  const { state } = usePioneer();
  const { app, balances, pubkeys } = state;
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const itemsPerPage = 6;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isSubmitAddressModalOpen, setIsSubmitAddressModalOpen] = useState(false);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      if (app) {
        console.log('app: ', app.pubkeys);
        let allTokens = await app.getAssets();

        //remove tokens that are not native
        allTokens = allTokens.filter((token) => token.type === 'native');

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < allTokens.length; i++) {
          let token = allTokens[i];
          let pubkey = pubkeys.find((pk: { networks: string | any[] }) =>
            pk.networks.includes(token.networkId),
          );
          if (pubkey) {
            // console.log('pubkey: ', pubkey);
            allTokens[i].pubkey = pubkey.pubkey;
            allTokens[i].address = pubkey.address || pubkey.master;
          } else {
            allTokens[i].needsPubkey = true;
          }
          let balance = balances.find((b: { caip: string }) => b.caip === token.caip);
          if (balance) {
            allTokens[i].balance = balance.balance;
          }
        }
        allTokens.sort((a, b) => {
          if (a.balance && !b.balance) return -1;
          if (!a.balance && b.balance) return 1;
          if (a.pubkey && !b.pubkey) return -1;
          if (!a.pubkey && b.pubkey) return 1;
          return 0;
        });
        console.log('allTokens: ', allTokens);
        setAssets(allTokens);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [app]);

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    setCurrentPageIndex(0);
    setSearch('');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setCurrentPageIndex(0);
  };

  const handleSelectClick = (asset: any) => {
    onSelect()
    let pubkey = pubkeys.find((pk: { networks: string | any[] }) =>
      pk.networks.includes(asset.networkId),
    );
    if (pubkey) {
      asset.address = pubkey.address || pubkey.master;
      onSelect(asset);
    } else {
      setSelectedAsset(asset);
      setIsSubmitAddressModalOpen(true);
    }
  };

  return (
    <Stack spacing={4}>
      {/* Submit Address Modal */}
      <Modal isOpen={isSubmitAddressModalOpen} onClose={() => setIsSubmitAddressModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Custom Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Please submit the address for {selectedAsset?.name}:</Text>
            <Input placeholder="Enter address..." />
            <Text color="red.500" mt={4}>
              Warning: This address is NOT controlled by Pioneer. You must verify that you can
              manage these funds outside of Pioneer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => setIsSubmitAddressModalOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Search2Icon color="gray.300" />
        </InputLeftElement>
        <Input
          onChange={handleSearchChange}
          placeholder="Search assets..."
          type="text"
          value={search}
        />
      </InputGroup>
      <Box>
        <Tabs onChange={handleTabChange}>
          <TabList>
            <Tab>Native Assets</Tab>
            <Tab>Token Platforms</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {isLoading ? (
                <Spinner />
              ) : (
                assets.map((asset, index) => (
                  <Box key={index}>
                    <Flex
                      alignItems="center"
                      justifyContent="space-between" // Added for alignment
                      bg="black"
                      border="1px solid #fff"
                      borderRadius="md"
                      boxShadow="sm"
                      padding={2}
                    >
                      <Avatar
                        size="md"
                        src={`https://pioneers.dev/coins/${COIN_MAP_LONG[asset.chain]}.png`}
                      >
                        <AvatarBadge boxSize="1.25em">
                          <Image
                            rounded="full"
                            src={`https://pioneers.dev/coins/${COIN_MAP_LONG[asset.chain]}.png`}
                          />
                        </AvatarBadge>
                      </Avatar>
                      <Box ml={3}>
                        <Text fontSize="sm">Asset: {asset?.identifier}</Text>
                        <Text fontSize="sm">{asset?.name}</Text>
                        {asset.address && <Text fontSize="sm">Address: <MiddleEllipsis text={asset.address} /></Text>}
                        {asset.balance && <Text fontSize="sm">Balance: {asset.balance}</Text>}
                      </Box>
                      <Button size='sm' onClick={handleSelectClick}>Select</Button>
                    </Flex>
                  </Box>
                ))
              )}
            </TabPanel>
            <TabPanel>
              <p>Coming Soon!</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <Flex justifyContent="space-between" mt={4}>
        {/*<Button*/}
        {/*  isDisabled={currentPageIndex === 0}*/}
        {/*  onClick={() => setCurrentPageIndex(currentPageIndex - 1)}*/}
        {/*>*/}
        {/*  Previous Page*/}
        {/*</Button>*/}
        {/*<Button*/}
        {/*  isDisabled={assets.length < itemsPerPage}*/}
        {/*  onClick={() => setCurrentPageIndex(currentPageIndex + 1)}*/}
        {/*>*/}
        {/*  Next Page*/}
        {/*</Button>*/}
      </Flex>
    </Stack>
  );
}
