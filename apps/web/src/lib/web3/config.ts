import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { defineChain } from "viem";

// Anvil local chain — simulates Base Sepolia (chain ID 84532)
export const anvilBaseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia (Anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [anvilBaseSepolia],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [anvilBaseSepolia.id]: http(),
  },
});
