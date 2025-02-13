"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import sdk from "@farcaster/frame-sdk";
import type { CalBooking } from "@/types/cal.com";
import { CONTRACT_ADDRESS, USDC_ADDRESS } from "@/utils/constant/contracts";
import ABI from "@/utils/constant/abis";
import { savePayment, updatePaymentStatus } from "@/lib/supbase/client";

interface PaymentProps {
  bookingId: string | null;
}

export function Payment({ bookingId }: PaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<CalBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApprovalStep, setIsApprovalStep] = useState(true);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: hash,
    isPending,
    sendTransaction,
    error: txError
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: hash as `0x${string}`,
    });

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("No booking selected");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch booking");
        }
        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch booking");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handlePayment = useCallback(async () => {
    if (!booking || !address || !publicClient) {
      setError("Missing required data for payment");
      return;
    }

    try {
      setError(null);
      const context = await sdk.context;
      const paymentAmount = parseEther("250"); // Fixed amount of 250 USDC

      if (isApprovalStep) {
        // First approve USDC spending
        const { request: approveRequest } = await publicClient.simulateContract({
          account: address,
          address: USDC_ADDRESS as `0x${string}`,
          abi: [{
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function"
          }],
          functionName: "approve",
          args: [CONTRACT_ADDRESS, paymentAmount],
        });

        await sendTransaction(approveRequest);
        setIsApprovalStep(false);
      } else {
        // Save initial payment record before making the payment
        if (context.user?.fid && bookingId) {
          await savePayment({
            fid: context.user.fid.toString(),
            booking_id: bookingId,
            amount: "250",
            status: "PENDING"
          });
        }

        // Then make the payment
        const { request: paymentRequest } = await publicClient.simulateContract({
          account: address,
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: ABI,
          functionName: "makeUSDCPayment",
          args: [
            context.user?.fid.toString() || "0",
            booking.responses.name.value,
            booking.responses.email.value,
            booking.responses.notes?.value || "",
            BigInt(new Date(booking.startTime).getTime() / 1000),
            paymentAmount,
            booking.responses.guests?.value || [],
          ],
        });

        await sendTransaction(paymentRequest);
      }
    } catch (err) {
      console.error("Payment error:", err);
      // Update payment status to FAILED if error occurs
      const context = await sdk.context;
      if (context.user?.fid && bookingId) {
        await updatePaymentStatus(bookingId, "FAILED");
      }
      setError(
        err instanceof Error 
          ? err.message 
          : txError?.message || "Payment failed"
      );
      // Reset approval step if there was an error
      setIsApprovalStep(true);
    }
  }, [booking, address, sendTransaction, publicClient, bookingId, isApprovalStep, txError]);

  // Handle successful payment
  useEffect(() => {
    if (isConfirmed && hash && bookingId) {
      const updateBooking = async () => {
        try {
          if (!isApprovalStep) {
            // Only update statuses after the actual payment (not the approval)
            // Update booking status in Cal.com
            await fetch(`/api/bookings/${bookingId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "ACCEPTED"
              }),
            });

            // Update payment status in Supabase
            const context = await sdk.context;
            if (context.user?.fid) {
              await updatePaymentStatus(bookingId, "COMPLETED", hash);

              // Send success notification
              await fetch("/api/notifications", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Skip-Rate-Limit": "true",
                },
                body: JSON.stringify({
                  fid: context.user.fid,
                  notificationId: hash,
                  title: "Payment Successful! 🎉",
                  body: "Your Life Advice session has been booked and paid for.",
                  priority: "high",
                }),
              });
            }
          }
        } catch (error) {
          console.error("Failed to update booking status:", error);
          setError("Payment completed but failed to update booking status");
        }
      };
      updateBooking();
    }
  }, [isConfirmed, hash, bookingId, isApprovalStep]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">{error}</div>
          <Button
            onClick={() => {
              setError(null);
              setIsApprovalStep(true);
            }}
            className="mt-4 w-full"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardContent className="pt-6">
          <div className="text-center">Please schedule a session first</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md mt-8">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Complete Your Booking</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Session Details</h3>
            <p className="text-sm text-gray-600">
              {new Date(booking.startTime).toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="font-medium">Amount</h3>
            <p className="text-sm text-gray-600">250 USDC</p>
          </div>

          <Button
            onClick={handlePayment}
            disabled={!isConnected || isPending || isConfirming}
            className="w-full"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isApprovalStep ? "Approving..." : "Processing Payment..."}
              </>
            ) : (
              isApprovalStep ? "Approve USDC" : "Complete Payment"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

