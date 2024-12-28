// PredictionMarket ABI for bet placement and market interactions
export const PredictionMarketABI = [
  {
    type: 'function',
    name: 'placeBet',
    inputs: [{ name: 'outcome', type: 'uint8', internalType: 'uint8' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'claimWinnings',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getOdds',
    inputs: [],
    outputs: [
      { name: 'yesOdds', type: 'uint256', internalType: 'uint256' },
      { name: 'noOdds', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalBets',
    inputs: [],
    outputs: [
      { name: 'yesTotal', type: 'uint256', internalType: 'uint256' },
      { name: 'noTotal', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPosition',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      {
        name: 'position',
        type: 'tuple',
        internalType: 'struct IPredictionMarket.Position',
        components: [
          { name: 'yesShares', type: 'uint256', internalType: 'uint256' },
          { name: 'noShares', type: 'uint256', internalType: 'uint256' },
          { name: 'claimed', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMarketInfo',
    inputs: [],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        internalType: 'struct IPredictionMarket.MarketInfo',
        components: [
          { name: 'question', type: 'string', internalType: 'string' },
          { name: 'category', type: 'string', internalType: 'string' },
          { name: 'resolutionTime', type: 'uint256', internalType: 'uint256' },
          { name: 'resolved', type: 'bool', internalType: 'bool' },
          { name: 'winningOutcome', type: 'uint8', internalType: 'uint8' },
          { name: 'totalYesShares', type: 'uint256', internalType: 'uint256' },
          { name: 'totalNoShares', type: 'uint256', internalType: 'uint256' },
          { name: 'totalPool', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateShares',
    inputs: [
      { name: 'outcome', type: 'uint8', internalType: 'uint8' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateWinnings',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'winnings', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'BetPlaced',
    inputs: [
      { name: 'bettor', type: 'address', indexed: true, internalType: 'address' },
      { name: 'outcome', type: 'uint8', indexed: true, internalType: 'uint8' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'shares', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Claimed',
    inputs: [
      { name: 'claimer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const
