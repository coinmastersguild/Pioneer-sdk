'use client';
import { Box } from '@chakra-ui/react';
// @ts-ignore
import { useEffect, useState } from 'react';

import CalculatingComponent from '../../../components/CalculatingComponent';
import Quote from "../../../components/Quote";

const BeginSwap = ({ quote, onAcceptSign }: any) => {
  const [showGif, setShowGif] = useState(true);

  // wait for routes
  useEffect(() => {
    console.log("Quote changed: ", quote);
    if (quote && quote.quote) {
      setShowGif(false);
    }
  }, [quote]);

  return (
    <Box>
      {showGif ? (
        <Box>
          <CalculatingComponent />
        </Box>
      ) : (
        <div>
          <Quote quote={quote} onAcceptSign={onAcceptSign} />
        </div>
      )}
    </Box>
  );
};

export default BeginSwap;
