# Zama OG → $FUNGO Checker

Paste any Ethereum wallet or ENS name. The page reads the **Zama OG** NFT contract live on Ethereum mainnet and shows how many Zama OG NFTs the wallet holds, plus the $FUNGO those NFTs carry under FungoLabs' published rule. Wallets with none get a link to buy one on OpenSea.

**Live:** https://naimuli74.github.io/zama-fungo-checker/

Read-only. No wallet connect, no signatures, no backend. Static HTML/CSS/JS on GitHub Pages.

## Facts used (all public)
| Fact | Value | Source |
|---|---|---|
| Zama OG contract | `0xb3f2ddaed136cf10d5b228ee2eff29b71c7535fc` (ERC-721, Ethereum) | [zama.org](https://www.zama.org/post/zama-og-nft-claim-portal-is-live) |
| Pool for Zama OG holders | 7% of 10B = 700,000,000 $FUNGO | [FungoLabs 3/6](https://x.com/FungoLabs/status/2117217770374848865) |
| Per NFT | 140,112 $FUNGO, same for every NFT (4,996 NFTs) | [fungolabs.org tokenomics](https://fungolabs.org/launchpad/tokenomics) |
| Snapshot | Holder at the TGE block (announced in advance) | tokenomics page |
| Claim | 7 days, unclaimed burned, $FUNGO or cFUNGO | [FungoLabs 4/6](https://x.com/FungoLabs/status/2117217774665650426) |
| Marketplace | [OpenSea: zama-og-nft-official](https://opensea.io/collection/zama-og-nft-official) | linked from FungoLabs tokenomics |

To update numbers, edit `config.js`.

## How it works
- `balanceOf(address)` on the Zama OG contract via public RPCs with automatic fallback (publicnode, dRPC, MEV Blocker, 1RPC, Blast).
- ENS names resolve via the ENS registry (`keccak.js` computes the namehash locally).
- `?address=` in the URL pre-fills and runs a check, so results can be shared.

## Disclaimer
Unofficial community tool. Not affiliated with Zama or FungoLabs. The final $FUNGO amount depends on who holds each NFT at the TGE block and on FungoLabs' claim contract. Never enter a seed phrase or sign anything to "check" an airdrop.
