import { publicClient, CONTRACT_ADDRESS, USDC_ADDRESS, account } from "../client";
import type { Address } from "viem";

export async function checkAllowance(ownerAddress: Address): Promise<bigint> {
    try {
        const allowance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: [
                {
                    inputs: [
                        { name: "owner", type: "address" },
                        { name: "spender", type: "address" }
                    ],
                    name: "allowance",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "allowance",
            args: [ownerAddress, CONTRACT_ADDRESS]
        });

        console.log("Current USDC allowance:", allowance);
        return allowance;
    } catch (error) {
        console.error("Error checking allowance:", error);
        return 0n;
    }
}

// If running directly
if (require.main === module) {
    checkAllowance(account.address);
} 