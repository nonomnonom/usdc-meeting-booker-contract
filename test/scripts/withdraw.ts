import { walletClient, publicClient, CONTRACT_ADDRESS, USDC_ADDRESS, account } from "../client";
import ABI from "../constant/abis";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

async function testWithdrawSecurity() {
    try {
        // Generate random account
        const randomPrivateKey = generatePrivateKey();
        const randomAccount = privateKeyToAccount(randomPrivateKey);
        console.log("Testing with random address:", randomAccount.address);

        // Try to withdraw with random account (should fail)
        console.log("\nTrying to withdraw with unauthorized account...");
        const randomWalletClient = createWalletClient({
            account: randomAccount,
            chain: baseSepolia,
            transport: http()
        });

        try {
            await randomWalletClient.writeContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "withdrawUSDC"
            });
        } catch (error) {
            console.log("✅ Withdraw with unauthorized account failed as expected");
        }

        // Now try with the real owner
        console.log("\nTrying to withdraw with owner account...");
        await withdrawUSDC();
    } catch (error) {
        console.error("Error in security test:", error);
    }
}

async function withdrawUSDC() {
    try {
        // Check if caller is owner
        const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "owner"
        });

        if (owner.toLowerCase() !== account.address.toLowerCase()) {
            throw new Error("Only owner can withdraw funds");
        }

        // Check contract balance before withdrawal
        const balance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: [
                {
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "balanceOf",
            args: [CONTRACT_ADDRESS]
        });

        console.log("Contract USDC balance before withdrawal:", balance);

        if (balance === 0n) {
            console.log("No USDC to withdraw");
            return;
        }

        // Perform withdrawal
        const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "withdrawUSDC"
        });

        console.log("Withdrawal transaction hash:", hash);
        
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("Withdrawal confirmed in block:", receipt.blockNumber);

        // Check new balance
        const newBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: [
                {
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "balanceOf",
            args: [CONTRACT_ADDRESS]
        });

        console.log("Contract USDC balance after withdrawal:", newBalance);
    } catch (error) {
        console.error("Error withdrawing USDC:", error);
    }
}

// Run security test
testWithdrawSecurity();
