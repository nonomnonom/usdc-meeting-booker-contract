import { baseSepolia } from "viem/chains";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";


dotenv.config({ path: "../.env" });

if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is not set");
}

// Ensure private key has 0x prefix
const PRIVATE_KEY = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY as `0x${string}` 
    : `0x${process.env.PRIVATE_KEY}` as `0x${string}`;

export const account = privateKeyToAccount(PRIVATE_KEY);

export const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
});

export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

export const CONTRACT_ADDRESS = "0xe1F39230b2D8F43b097CA4a6D0b3B9b2B6da91a0";
export const USDC_ADDRESS = "0x833615562852909e079C1304892587943d2879bC";