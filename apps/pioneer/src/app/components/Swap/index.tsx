'use client';
import { AddIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { FeeOption } from '@coinmasters/types';
// import { COIN_MAP_LONG } from "@pioneer-platform/pioneer-coins";
import { useEffect, useState } from 'react';

import AssetSelect from '../../components/AssetSelect';
import ErrorQuote from '../../components/ErrorQuote';
import OutputSelect from '../../components/OutputSelect';
import Pending from '../../components/Pending';
import Quotes from '../../components/Quotes';
import SignTransaction from '../../components/SignTransaction';
import { usePioneer } from '@coinmasters/pioneer-react';

// import backgroundImage from "lib/assets/background/thorfox.webp"; // Adjust the path
// import ForkMeBanner from "lib/components/ForkMe";
import BeginSwap from './steps/BeginSwap'; // Updated import here
import CompleteSwap from './steps/CompleteSwap'; // Updated import here
import SelectAssets from './steps/SelectAssets';
import { useParams } from 'next/navigation';
import Quote from '../Quote';

const MODAL_STRINGS = {
  selectAsset: 'Select Asset',
  selectQuote: 'Select Quote',
  selectOutbound: 'Select Outbound',
  confirmTrade: 'Confirm Trade',
  pending: 'Show Pending',
  errorQuote: 'Error Quote',
};

const Swap = () => {
  const { state } = usePioneer();
  const { txid } = useParams<{ txid?: string }>();
  const { app, assetContext, outboundAssetContext, blockchainContext } = state;
  // tabs
  const [tabIndex, setTabIndex] = useState(0);
  // steps
  const [step, setStep] = useState(0);
  const [modalType, setModalType] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [route, setRoute] = useState(null);
  const [quoteId, setQuoteId] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState<any>({});
  const [inputAmount, setInputAmount] = useState(0);
  const [txHash, setTxhash] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0); // New state for current route index
  const [selectedButton, setSelectedButton] = useState('quick'); // Initial selected button is "Quick"
  const [isContinueDisabled, setIsContinueDisabled] = useState(true); // Initial continue button is disabled
  const [quotesData, setQuotesData] = useState<typeof Quote[]>([]);

  // const handleSliderChange = (event) => {
  //   setTabIndex(parseInt(event.target.value, 10));
  // };

  const handleTabsChange = (index: any) => {
    setTabIndex(index);
  };

  const handleClick = (button: any) => {
    setSelectedButton(button);
  };
  const [continueButtonContent, setContinueButtonContent] = useState('Continue'); // Initial continue button content is "Continue"
  // const [assets] = useState([]); // Array to store assets
  const [showGoBack, setShowGoBack] = useState(false);

  useEffect(() => {
    if (app && app.swapKit && assetContext && outboundAssetContext && step === 0) {
      setIsContinueDisabled(false);
    }
  }, [app, assetContext, blockchainContext, outboundAssetContext, step]);

  useEffect(() => {
    if (step === 0) {
      setShowGoBack(false);
    }
    if (step === 1) {
      setContinueButtonContent('Accept Route');
    }
  }, [step]);

  const openModal = (type: any) => {
    setModalType(type);
    onOpen();
  };

  const fetchQuote = async () => {
    console.log('sliderValue: ', sliderValue);
    const senderAddress = assetContext.address;
    const recipientAddress =
      outboundAssetContext.address || app.swapKit.getAddress(outboundAssetContext.chain);
    console.log('outboundAssetContext: ', outboundAssetContext);

    if (!recipientAddress) {
      console.log('outboundAssetContext: ', outboundAssetContext);
      throw Error('must have recipient address');
    }

    try {
      const newAmountIn = (sliderValue / 100) * parseFloat(assetContext?.balance || '0');
      setInputAmount(newAmountIn);

      //get receiver context
      const entry = {
        sellAsset: app.assetContext,
        // @ts-ignore
        sellAmount: parseFloat(newAmountIn).toPrecision(3),
        buyAsset: app.outboundAssetContext,
        senderAddress,
        recipientAddress,
        slippage: '3',
      };
      console.log('entry: ', entry);
      try {
        let result = await app.pioneer.Quote(entry);
        result = result.data;
        console.log('result: ', result);

        if (result) {
          setQuotesData(result);
          openModal(MODAL_STRINGS.selectQuote);
        }

        // if error, render Error
        if (result && result.error) {
          openModal(MODAL_STRINGS.errorQuote);
          setError(result);
        }
      } catch (e) {
        openModal(MODAL_STRINGS.errorQuote);
        setError(`Invalid request: ${e}`);
      }
    } catch (e: any) {
      console.error('ERROR: ', e);
      // alert(`Failed to get quote! ${e.message}`);
    }
  };

  let handleQuoteSelection = function (quote: any) {
    console.log('onSelectQuote: ', quote);
    setQuoteId(quote.id);
    if(quote && quote.quote)setQuote(quote);
    onClose();
  };

  // start the context provider
  useEffect(() => {
    if (txid) {
      console.log('Set txid: ', txid);
      // set the txid
      // @ts-ignore
      setTxhash(txid);
      setStep(2);
    } else {
      // check pending
      const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') ?? '[]');

      console.log('pendingTransactions: ', pendingTransactions);
      if (pendingTransactions && pendingTransactions.length > 0) {
        openModal(MODAL_STRINGS.pending);
      }
    }
  }, []);

  const handleClickContinue = () => {
    try {
      if (step === 0) {
        fetchQuote();
        setStep((prevStep) => prevStep + 1);
        setShowGoBack(true);
        return;
      }
      if (step === 1) {
        const swapParams = {
          recipient: assetContext.address,
          feeOptionKey: FeeOption.Fast,
        };
        console.log('swapParams: ', swapParams);
        fetchQuote();
        openModal(MODAL_STRINGS.confirmTrade);
      }
      if (step === 1) {
        // check if confirmed
        // if confirmed
        // setStep((prevStep) => prevStep + 1)
      }
    } catch (e) {
      console.error(e);
    }
  };

  // start the context provider
  useEffect(() => {
    if (step === 1 && txHash) {
      setShowGoBack(false);
      // check if confirmed
      // if confirmed
      setStep((prevStep) => prevStep + 1);
    }
  }, [txHash]);

  const goBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <SelectAssets
            handleClick={handleClick}
            openModal={openModal}
            selectedButton={selectedButton}
            setSliderValue={setSliderValue}
            sliderValue={sliderValue}
          />
        );
      case 1:
        return <BeginSwap onAcceptSign={onAcceptSign} quote={quote} />;
      case 2:
        return <CompleteSwap quoteId={quoteId} route={route} txHash={txHash} />;
      default:
        return null;
    }
  };

  let onSelectOutput = async function (asset: any) {
    console.log('onSelectOutput');
    await app.setOutboundAssetContext(asset);
    onClose();
  };

  let onSelect = async function () {
    console.log('onSelect');
    onClose();
  };

  let onAcceptSign: any = function () {
    console.log('onAcceptSign');
    openModal(MODAL_STRINGS.confirmTrade);
  };

  return (
    <Box>
      {/* <ForkMeBanner /> */}
      <Modal isOpen={isOpen} onClose={() => onClose()} size="xl">
        <ModalOverlay />
        <ModalContent bg="black">
          <ModalHeader>{modalType}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Render content based on modalType */}
            {modalType === MODAL_STRINGS.selectAsset && (
              <div>
                <AssetSelect onClose={onClose} onSelect={onSelect} />
              </div>
            )}
            {modalType === MODAL_STRINGS.selectOutbound && (
              <div>
                <OutputSelect onClose={onClose} onSelect={onSelectOutput} />
              </div>
            )}
            {modalType === MODAL_STRINGS.selectQuote && (
              <div>
                <Quotes
                  Quotes={quotesData}
                  onClose={onClose}
                  onSelectQuote={handleQuoteSelection}
                />
              </div>
            )}
            {modalType === MODAL_STRINGS.confirmTrade && (
              <div>
                <SignTransaction
                  onClose={onClose}
                  quote={quote}
                />
              </div>
            )}
            {modalType === MODAL_STRINGS.errorQuote && (
              <div>
                <ErrorQuote error={error} onClose={onClose} />
              </div>
            )}
            {modalType === MODAL_STRINGS.pending && (
              <div>
                <Pending onClose={onClose} />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box bg="black" mx="auto" w="35rem">
        {renderStepContent()}
      </Box>
      <Flex alignItems="center" bg="black" flexDirection="column" mx="auto" p="2rem" w="35rem">
        {showGoBack && (
          <div>
            <Button onClick={goBack}>Go Back</Button>
          </div>
        )}

        <Button
          colorScheme="blue"
          isDisabled={isContinueDisabled}
          leftIcon={<AddIcon />}
          mt={4}
          onClick={() => handleClickContinue()}
        >
          {continueButtonContent}
        </Button>
      </Flex>
    </Box>
  );
};

export default Swap;
