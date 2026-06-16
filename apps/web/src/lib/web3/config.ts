import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { defineChain } from "viem";
import { anvil } from "wagmi/chains";

// Anvil local chain — simulates Base Sepolia (chain ID 84532)
export const anvilBaseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia (Anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
  testnet: true,
});

// Arbitrum Sepolia
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL ||
          "https://sepolia-rollup.arbitrum.io/rpc",
      ],
    },
  },
  testnet: true,
});

// Ethereum Sepolia
export const ethereumSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ||
          "https://ethereum-sepolia-rpc.publicnode.com",
      ],
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [anvilBaseSepolia, arbitrumSepolia, ethereumSepolia],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [anvilBaseSepolia.id]: http("http://localhost:8545", { timeout: 5_000 }),
    [arbitrumSepolia.id]: http(undefined, { timeout: 10_000 }),
    [ethereumSepolia.id]: http(undefined, { timeout: 10_000 }),
  },
});
