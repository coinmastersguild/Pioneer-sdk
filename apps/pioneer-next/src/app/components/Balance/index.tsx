import React, { useState } from 'react';
import {
  Avatar, Box, Stack, Flex, Text, Button, Collapse, IconButton,
  useColorModeValue, Badge, Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { getWalletBadgeContent } from '../WalletIcon';
import { usePioneer } from '../../context';
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

let TAG = " | Balance | ";

interface BalanceProps {
  onClose: () => void;
  balance: any;
}

export default function Balance({ onClose, balance }: BalanceProps) {
  const navigate = useNavigate();
  const { state, hideModal, resetState } = usePioneer();
  const { api, app, balances, context } = state;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const data = typeof balance === 'object' && balance !== null ? balance : JSON.parse(balance || '{}');

  const balanceFormatted = balance.balance || 'N/A';
  const valueUsdFormatted = balance.valueUsd ? `$${balance.valueUsd}` : 'N/A';

  const handleModal = (action: string) => {
    console.log("balance: ", balance);
    app.setAssetContext(balance);
    console.log("action")
    navigate(`/intent/${action}`);
    onClose();
  };

  const handleCloseModal = () => {
    hideModal();
    resetState();
  };

  return (
    <Stack spacing={4}>
      <Flex alignItems="center">
        <Avatar
          size="md"
          src={`https://pioneers.dev/coins/${COIN_MAP_LONG[balance?.chain]}.png`}
          mr={4}
        >
          {getWalletBadgeContent(balance?.context.split(':')[0])}
        </Avatar>
        <Box border="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} borderRadius="md" p={4} flexGrow={1}>
          <Badge colorScheme="blue" mb={2}>{balance.ticker || 'N/A'}</Badge>
          <Text fontSize="lg">Balance: {balanceFormatted}</Text>
          <Text fontSize="lg">Value (USD): {valueUsdFormatted}</Text>
        </Box>
        <Box ml={4}>
          <Button colorScheme="blue" size="lg" onClick={() => handleModal('transfer')}>Send</Button>
          <Button colorScheme="green" size="lg" onClick={() => handleModal('receive')}>Receive</Button>
          <Button colorScheme="purple" size="lg" onClick={() => handleModal('swap')}>Swap</Button>
        </Box>
      </Flex>
      <Collapse in={showAdvanced} animateOpacity>
        <Box border="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} borderRadius="md" p={4}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Key</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
                <Tr key={key}>
                  <Td>{key}</Td>
                  <Td>
                    {typeof value === 'string'
                      ? value
                      : typeof value === 'number'
                        ? value.toString()
                        : typeof value === 'boolean'
                          ? value.toString()
                          : value === null
                            ? 'null'
                            : typeof value === 'object'
                              ? JSON.stringify(value)
                              : 'Unsupported Type'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Collapse>
      <Box alignSelf="flex-end">
        <IconButton
          icon={<ChevronDownIcon />}
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Show Advanced"
        />
      </Box>
    </Stack>
  );
}
