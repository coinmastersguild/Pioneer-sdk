import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Tooltip,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { AssetValue } from '@pioneer-platform/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import { getWalletBadgeContent } from '../WalletIcon';
//@ts-ignore
import confetti from 'canvas-confetti'; // Make sure to install the confetti package

export function Transfer({ usePioneer }: any): JSX.Element {
  const toast = useToast();
  const { state, setIntent, connectWallet } = usePioneer();
  const { app, assetContext, context } = state;
  const [isPairing, setIsPairing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMax, setisMax] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [sendAmount, setSendAmount] = useState<any | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memo, setMemo] = useState('');
  const [recipient, setRecipient] = useState('');
  const [walletType, setWalletType] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [maxSpendable, setMaxSpendable] = useState('');
  const [loadingMaxSpendable, setLoadingMaxSpendable] = useState(true);

  const textColor = useColorModeValue('gray.600', 'gray.200');
  const bgColor = useColorModeValue('white', 'gray.700');
  const headingColor = useColorModeValue('teal.500', 'teal.300');

  useEffect(() => {
    if(assetContext.icon)setAvatarUrl(assetContext.icon);
  }, [app, app?.swapKit, assetContext]);

  useEffect(() => {
    if (context) {
      setWalletType(context.split(':')[0]);
    }
  }, [context]);

  useEffect(() => {
    setIsPairing(false);
  }, [app]);

  let onStart = async function () {
    let tag = " | onStart Transfer | ";
    if (app && app.swapKit && assetContext && assetContext.chain && app.swapKit.estimateMaxSendableAmount && assetContext.networkId) {
      console.log("onStart Transfer page");
      console.log(tag, "assetContext: ", assetContext);

      const walletInfo = await app.swapKit.syncWalletByChain(assetContext.chain);
      console.log(tag, "walletInfo: ", walletInfo);
      if (!walletInfo) {
        console.log(tag, "connectWallet needed!");
        await connectWallet('KEEPKEY');
        setTimeout(onStart, 200);
      } else {
        let pubkeys = await app.pubkeys;
        pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
        console.log("onStart Transfer pubkeys", pubkeys);

        //get assetValue for the asset
        // console.log(tag,"assetValue:", assetValue);
        if(!assetContext.caip) throw Error('Invalid asset context. Missing caip.')
        let estimatePayload: any = {
          feeRate: 10,
          caip: assetContext.caip,
          pubkeys,
          memo,
          recipient,
        };
        let maxSpendableAmount = await app.swapKit.estimateMaxSendableAmount({ chain: assetContext.chain, params: estimatePayload });
        console.log("maxSpendableAmount", maxSpendableAmount);
        console.log("maxSpendableAmount", maxSpendableAmount.getValue('string'));
        console.log("onStart Transfer pubkeys", pubkeys);
        setMaxSpendable(maxSpendableAmount.getValue('string'));
        setLoadingMaxSpendable(false);
      }
    }
  };

  useEffect(() => {
    onStart();
  }, [app, app?.swapKit, assetContext]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setisMax(false);
    setInputAmount(event.target.value);
  };

  const handleRecipientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(event.target.value);
  };

  const handleSend = useCallback(async () => {
    try {
      if (!inputAmount) {
        alert('You MUST input an amount to send!');
        return;
      }
      if (!recipient) {
        alert('You MUST input a recipient to send to!');
        return;
      }
      setIntent(
        'transfer:' +
        assetContext.chain +
        ':' +
        assetContext.symbol +
        ':' +
        inputAmount +
        ':' +
        recipient,
      );
      const walletInfo = await app.swapKit.syncWalletByChain(assetContext.chain);

      if (!walletInfo) {
        let walletType = app.context.split(':')[0];
        connectWallet(walletType.toUpperCase());
        setTimeout(() => {
          handleSend();
        }, 3000);
      } else {
        setIsSubmitting(true);
        await AssetValue.loadStaticAssets();
        //@ts-ignore
        const assetValue = await AssetValue.fromIdentifier(assetContext.identifier, parseFloat(inputAmount));

        let sendPayload: any = {
          assetValue,
          memo,
          recipient,
        };
        if (isMax) sendPayload.isMax = true;
        const txHash = await app.swapKit.transfer(sendPayload);

        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.open(
              `${app.swapKit.getExplorerTxUrl(assetContext.chain, txHash as string)}`,
              '_blank',
            );
          }, 10000); // 30 seconds delay
        }

        confetti(); // Trigger confetti on successful transaction

        toast({
          title: 'Transaction Successful',
          description: `Transaction ID: ${txHash}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (errorSend: any) {
      console.error(errorSend);
      toast({
        title: 'Error',
        description: errorSend.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [assetContext, inputAmount, app, recipient, sendAmount, toast, memo, isMax, connectWallet, setIntent]);

  const setMaxAmount = () => {
    setisMax(true);
    setInputAmount(maxSpendable);
  };

  if (loadingMaxSpendable) {
    return (
      <Flex align="center" justify="center" height="100vh">
        <Box p={10} borderRadius="md" boxShadow="lg" bg={bgColor}>
          <Flex align="center" justify="center">
            <Spinner size="xl" />
            <Text ml={4}>Calculating max spendable amount...</Text>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <VStack align="start" borderRadius="md" p={6} spacing={5} bg={bgColor} boxShadow="lg" width={{ base: '100%', md: '75%', lg: '50%' }} margin="0 auto">
      <Heading as="h1" mb={4} size="lg" color={headingColor}>
        Send Crypto!
      </Heading>

      {isPairing ? (
        <Box>
          <Text mb={2} color={textColor}>
            Connecting to {context}...
            <Spinner size="xl" />
            Please check your wallet to approve the connection.
          </Text>
        </Box>
      ) : (
        <div>
          <Flex align="center" direction={{ base: 'column', md: 'row' }} gap={20}>
            <Box>
              <Avatar size="xxl" src={avatarUrl}>
                {getWalletBadgeContent(walletType, '4em')}
              </Avatar>
            </Box>
            <Box>
              <Text mb={2} color={textColor}>Asset: {assetContext?.name || 'N/A'}</Text>
              <Text mb={2} color={textColor}>Chain: {assetContext?.chain || 'N/A'}</Text>
              <Text mb={4} color={textColor}>Symbol: {assetContext?.symbol || 'N/A'}</Text>
              <Text mb={4} color={textColor}>
                Max Spendable: {maxSpendable} {assetContext?.symbol}
              </Text>
            </Box>
          </Flex>
          <br />
          <Grid
            gap={10}
            templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
            w="full"
          >
            <FormControl>
              <FormLabel color={textColor}>Recipient:</FormLabel>
              <Input
                onChange={handleRecipientChange}
                placeholder="Address"
                value={recipient}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={textColor}>Input Amount:</FormLabel>
              <Input
                onChange={handleInputChange}
                placeholder="0.0"
                value={inputAmount}
              />
            </FormControl>
          </Grid>
          {!assetContext.networkId.includes('eip155') && (
            <Flex justify="space-between" align="center" mt="4">
              <Button
                variant="ghost"
                rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced
              </Button>
            </Flex>
          )}

          {showAdvanced && (
            <FormControl>
              <FormLabel color={textColor}>
                Memo:
                <Tooltip label="Optional memo to include with your transaction for reference." aria-label="A tooltip for memo input">
                  <InfoOutlineIcon ml="2" />
                </Tooltip>
              </FormLabel>
              <Input placeholder="Enter memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </FormControl>
          )}
          <br />
          <Button onClick={setMaxAmount} size="sm" colorScheme="teal">MAX</Button>
        </div>
      )}

      <Button
        colorScheme="green"
        w="full"
        mt={4}
        onClick={handleSend}
        isLoading={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </Button>
    </VStack>
  );
}

export default Transfer;
