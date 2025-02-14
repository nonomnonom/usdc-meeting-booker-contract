"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import sdk from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import ABI from "@/lib/abis";
import { supabase } from "@/lib/db/supbase";

const CONTRACT_ADDRESS = "0xe1F39230b2D8F43b097CA4a6D0b3B9b2B6da91a0";
const USDC_ADDRESS = "0x833615562852909e079C1304892587943d2879bC";

const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
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
] as const;

const PendingBookingCard = ({ booking, isChecked, onCheckChange, onCardClick }: {
  booking: any;
  isChecked: boolean;
  onCheckChange: (checked: boolean) => void;
  onCardClick: () => void;
}) => (
  <Card 
    className="relative mb-4 p-4 rounded-lg border cursor-pointer"
    onClick={onCardClick}
  >
    <div className="space-y-1">
      <p className="font-medium">Booking details</p>
      <p className="text-sm text-muted-foreground">{booking?.date || "No date"}</p>
    </div>
    <div className="absolute top-2 right-2" onClick={(e) => {
      e.stopPropagation();
      onCheckChange(!isChecked);
    }}>
      <Checkbox checked={isChecked} />
    </div>
    <div className="absolute bottom-2 right-2">
      <span className="text-sm text-yellow-500">pending</span>
    </div>
  </Card>
);

const HistoryBookingCard = ({ booking, onCardClick }: {
  booking: any;
  onCardClick: () => void;
}) => (
  <Card 
    className="relative mb-4 p-4 rounded-lg border cursor-pointer"
    onClick={onCardClick}
  >
    <div className="space-y-1">
      <p className="font-medium">Booking details</p>
      <p className="text-sm text-muted-foreground">{booking?.date || "No date"}</p>
    </div>
    <div className="absolute bottom-2 right-2">
      <span className={`text-sm ${
        booking.status === 'confirmed' ? 'text-green-500' : 'text-red-500'
      }`}>
        {booking.status}
      </span>
      {booking.status === 'confirmed' && booking.txHash && (
        <a 
          href={`https://basescan.org/tx/${booking.txHash}`}
          target="_blank"
          rel="noopener noreferrer" 
          className="ml-2 text-sm text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          View tx
        </a>
      )}
    </div>
  </Card>
);

export default function Payment() {
  const [isChecked, setIsChecked] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedForDialog, setSelectedForDialog] = useState<any>(null);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
  const [paymentHash, setPaymentHash] = useState<`0x${string}` | undefined>();

  const { address, isConnected } = useAccount();
  const { writeContract, isPending, writeContractAsync } = useWriteContract();
  
  // Transaction receipt hooks
  const { data: approveReceipt, isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  
  const { data: paymentReceipt, isLoading: isPaymentLoading } = useWaitForTransactionReceipt({
    hash: paymentHash,
  });

  // Read allowance
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined
  });

  useEffect(() => {
    const initializeSDK = async () => {
      const context = await sdk.context;
      if (context.user?.fid) {
        setUserFid(context.user.fid);
      }
    };
    initializeSDK();
  }, []);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!userFid) return;

      const { data: bookings, error } = await supabase
        .from('cal_bookings')
        .select('*')
        .eq('fid', userFid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      setPendingBookings(bookings.filter((b: { status: string }) => b.status === 'pending'));
      setHistoryBookings(bookings.filter((b: { status: string }) => b.status !== 'pending'));
    };

    loadBookings();
  }, [userFid]);

  const handlePayment = async (booking: any) => {
    if (!address || !userFid) {
      console.error('No address or FID available');
      return;
    }

    const paymentAmount = parseUnits("250", 6); // USDC has 6 decimals, not 18

    try {
      // Check and approve if needed
      if (!allowance || allowance < paymentAmount) {
        console.log('Approving USDC...');
        const hash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, paymentAmount],
        });
        
        setApproveHash(hash);
        
        // Wait for approval
        while (isApproveLoading || !approveReceipt) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('USDC approved:', approveReceipt.transactionHash);
      }

      // Prepare guest emails array
      const guestEmails = booking.guests?.map((g: any) => g.email) || [];

      // Make payment
      console.log('Making payment...');
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "makeUSDCPayment",
        args: [
          userFid.toString(), // Convert FID to string
          booking.name || "",
          booking.email || "",
          booking.additional_notes || "",
          BigInt(Math.floor(new Date(booking.start_time).getTime() / 1000)),
          paymentAmount,
          guestEmails
        ],
      });

      setPaymentHash(hash);
      console.log('Payment transaction sent:', hash);

      // Wait for payment confirmation
      while (isPaymentLoading || !paymentReceipt) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('cal_bookings')
        .update({ 
          status: 'confirmed',
          txHash: hash 
        })
        .eq('booking_id', booking.booking_id);

      if (updateError) {
        console.error('Error updating booking status:', updateError);
      }

      setShowPaymentSheet(false);
      setIsChecked(false);

      // Show success message and open transaction
      await sdk.actions.close();
      await sdk.actions.openUrl(`https://basescan.org/tx/${hash}`);

    } catch (error) {
      console.error('Payment error:', error);
      await sdk.actions.close();
    }
  };

  const handleCardClick = (booking: any) => {
    setSelectedForDialog(booking);
    setShowBookingDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto p-4">
        <div className="space-y-4 mb-16">
          {pendingBookings.map((booking) => (
            <PendingBookingCard
              key={booking.booking_id}
              booking={booking}
              isChecked={isChecked}
              onCheckChange={setIsChecked}
              onCardClick={() => handleCardClick(booking)}
            />
          ))}
          
          <h2 className="text-sm text-muted-foreground mt-6 mb-2">History</h2>
          
          {historyBookings.map((booking) => (
            <HistoryBookingCard
              key={booking.booking_id}
              booking={booking}
              onCardClick={() => handleCardClick(booking)}
            />
          ))}
        </div>

        {/* Booking Details Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedForDialog?.start_time || "").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {selectedForDialog?.status}
                </p>
              </div>
              {selectedForDialog?.txHash && (
                <div>
                  <p className="text-sm font-medium">Transaction</p>
                  <a 
                    href={`https://basescan.org/tx/${selectedForDialog.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View on Basescan
                  </a>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowBookingDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Sheet */}
        {isChecked && selectedForDialog && (
          <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
            <SheetTrigger asChild>
              <Button 
                className="fixed bottom-16 left-4 right-4 mx-auto"
                onClick={() => setShowPaymentSheet(true)}
              >
                Pay 250 USDC
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-96">
              <SheetHeader>
                <SheetTitle>Confirm Payment</SheetTitle>
                <SheetDescription>
                  You are about to pay 250 USDC for your consultation.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={() => handlePayment(selectedForDialog)}
                  disabled={!isConnected || isPending}
                >
                  {isPending ? "Confirming..." : "Confirm Payment"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}