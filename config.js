/* Every number here comes from a public FungoLabs / Zama source. Edit only if they publish an update. */
window.CFG = {
  contract: '0xb3f2ddaed136cf10d5b228ee2eff29b71c7535fc', // Zama OG (ZAMAOG), ERC-721, Ethereum mainnet — zama.org
  chainId: 1,
  perNft: 140112,          // FUNGO per Zama OG NFT — fungolabs.org/launchpad/tokenomics
  nftsCounted: 4996,       // Zama OG NFTs counted by FungoLabs ("4,996 today")
  pool: 700000000,         // 7% of 10B FUNGO — FungoLabs thread 3/6
  totalSupply: 10000000000,
  claimDays: 7,
  // $FUNGO has no launch price yet (no TGE, no presale). These are assumed fully diluted valuations for the estimate only.
  fdvScenarios: [5e6, 10e6, 25e6, 50e6, 100e6],
  fdvDefault: 10e6,
  links: {
    opensea: 'https://opensea.io/collection/zama-og-nft-official',
    etherscan: 'https://etherscan.io/token/0xb3f2ddaed136cf10d5b228ee2eff29b71c7535fc',
    thread: 'https://x.com/FungoLabs/status/2117217762204676096',
    zamaPost: 'https://x.com/FungoLabs/status/2117217770374848865',
    claimPost: 'https://x.com/FungoLabs/status/2117217774665650426',
    tokenomics: 'https://fungolabs.org/launchpad/tokenomics',
    zamaBlog: 'https://www.zama.org/post/zama-og-nft-claim-portal-is-live'
  },
  rpcs: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.drpc.org',
    'https://rpc.mevblocker.io',
    'https://1rpc.io/eth',
    'https://eth-mainnet.public.blastapi.io'
  ]
};
