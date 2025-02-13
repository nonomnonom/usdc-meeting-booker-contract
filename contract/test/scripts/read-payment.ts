import { publicClient, CONTRACT_ADDRESS } from "../client";
import ABI from "../constant/abis";

export async function readPayment(paymentId: bigint) {
    try {
        const payment = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "getPayment",
            args: [paymentId]
        });

        console.log("Payment details:", {
            name: payment[0],
            email: payment[1],
            additionalNotes: payment[2],
            date: new Date(Number(payment[3]) * 1000).toLocaleString(),
            payer: payment[4],
            amount: payment[5],
            fid: payment[6],
            guestEmails: payment[7]
        });
    } catch (error) {
        console.error("Error reading payment:", error);
    }
}

// If running directly
if (require.main === module) {
    readPayment(0n);
}
