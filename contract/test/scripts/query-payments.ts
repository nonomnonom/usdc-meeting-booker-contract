import { publicClient, CONTRACT_ADDRESS } from "../client";
import ABI from "../constant/abis";

async function queryPayments() {
    try {
        let paymentId = 0n;
        const payments = [];

        while (true) {
            try {
                const payment = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: ABI,
                    functionName: "getPayment",
                    args: [paymentId]
                });

                payments.push({
                    id: Number(paymentId),
                    name: payment[0],
                    email: payment[1],
                    additionalNotes: payment[2],
                    date: new Date(Number(payment[3]) * 1000).toLocaleString(),
                    payer: payment[4],
                    amount: payment[5].toString(),
                    fid: payment[6],
                    guestEmails: payment[7]
                });

                paymentId++;
            } catch (error) {
                // If we get an error, we've reached the end of the payments
                break;
            }
        }

        console.log("All payments:", JSON.stringify(payments, null, 2));
        console.log("Total payments:", payments.length);
    } catch (error) {
        console.error("Error querying payments:", error);
    }
}

queryPayments();
