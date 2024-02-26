import { Box, Input, List, ListItem } from '@chakra-ui/react';
import React from 'react';

const AutocompleteInput = ({ inputValue, onInputChange, options, onOptionSelect }: any) => {
  return (
    <Box position="relative">
      <Input
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="What are you looking for?"
        type="text"
        value={inputValue}
      />
      {inputValue && (
        <List
          bg="white"
          boxShadow="md"
          maxH="200px"
          overflowY="auto"
          p={2}
          position="absolute"
          spacing={2}
          w="full"
          zIndex="dropdown"
        >
          {options.map((option: any, index: any) => (
            <ListItem
              _hover={{ bg: 'gray.100' }}
              cursor="pointer"
              key={index}
              onClick={() => onOptionSelect(option)}
              p={2}
            >
              {option}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default AutocompleteInput;
