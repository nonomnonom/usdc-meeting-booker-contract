import { walletClient, publicClient, CONTRACT_ADDRESS, USDC_ADDRESS } from "../client";
import ABI from "../constant/abis";
import { parseEther } from "viem";
import { checkAllowance } from "./check-allowance";

export async function makePayment() {
    try {
        // Check current allowance
        const currentAllowance = await checkAllowance(walletClient.account.address);
        const paymentAmount = parseEther("250");

        // Only approve if needed
        if (currentAllowance < paymentAmount) {
            console.log("Insufficient allowance. Approving USDC...");
            const approveHash = await walletClient.writeContract({
                address: USDC_ADDRESS,
                abi: [
                    {
                        inputs: [
                            { name: "spender", type: "address" },
                            { name: "amount", type: "uint256" }
                        ],
                        name: "approve",
                        outputs: [{ name: "", type: "bool" }],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "approve",
                args: [CONTRACT_ADDRESS, paymentAmount]
            });

            console.log("Approval transaction hash:", approveHash);
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
        } else {
            console.log("Sufficient allowance exists");
        }

        // Make the payment
        const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "makeUSDCPayment",
            args: [
                "fid123", // fid farcaster ( this for kv store notif management)
                "John Doe", // name
                "john@example.com", // email
                "Test payment", // additionalNotes
                BigInt(Math.floor(Date.now() / 1000)), // date
                paymentAmount, // amount
                ["guest1@example.com", "guest2@example.com"] // guestEmails
            ]
        });

        console.log("Payment transaction hash:", hash);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("Payment confirmed in block:", receipt.blockNumber);
    } catch (error) {
        console.error("Error making payment:", error);
    }
}

// If running directly
if (require.main === module) {
    makePayment();
}

