"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import sdk from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/db/supbase";
import { Loader2 } from "lucide-react";

const USDC_ADDRESS = "0x833615562852909e079C1304892587943d2879bC";
const USDC_DECIMALS = 18; 
const TARGET_ADDRESS = "0x7e176d20975760B849573e4b918C93ccdd9e32A4"; // Address to send to

// Add transaction state type
type TransactionState = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

// Card components
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
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-sm text-yellow-500">pending</span>
            {isChecked && (
                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCardClick();
                    }}
                >
                    Pay Now
                </Button>
            )}
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
      <span className={`text-sm ${booking.status === 'confirmed' ? 'text-green-500' : 'text-red-500'}`}>
        {booking.status}
      </span>
            {booking.status === 'confirmed' && booking.tx_hash && (
                <a
                    href={`https://basescan.org/tx/${booking.tx_hash}`}
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

const PaymentSheet = ({ 
    booking, 
    isChecked, 
    setIsChecked, 
    transactionState, 
    setTransactionState,
    handlePayment, 
    open, 
    onOpenChange,
    setSelectedForDialog,
    setShowPaymentSheet 
}: {
    booking: any;
    isChecked: boolean;
    setIsChecked: (checked: boolean) => void;
    transactionState: TransactionState;
    setTransactionState: (state: TransactionState) => void;
    handlePayment: (booking: any) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    setSelectedForDialog: (booking: any) => void;
    setShowPaymentSheet: (show: boolean) => void;
}) => {
    // Only allow closing if not in a processing state or after confirmation
    const canClose = !['pending', 'confirming'].includes(transactionState);
    
    useEffect(() => {
        if (!canClose) {
            onOpenChange(true); // Force sheet to stay open
        }
    }, [canClose, onOpenChange]);

    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);

    return (
        <Sheet open={open} onOpenChange={(newOpen) => canClose && onOpenChange(newOpen)}>
            <SheetContent side="bottom" className="h-[95%] sm:h-[85%] overflow-y-auto">
                <div className="flex flex-col gap-6 pb-6">
                    {transactionState === 'confirmed' ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-center">Payment Successful!</h3>
                            <p className="text-sm text-stone-600 text-center">
                                Your payment of 250 USDC has been confirmed.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        sdk.actions.openUrl(`https://basescan.org/tx/${booking.tx_hash}`);
                                    }}
                                >
                                    View Transaction
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowPaymentSheet(false);
                                        setSelectedForDialog(null);
                                        setIsChecked(false);
                                        setTransactionState('idle');
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-semibold">Booking Details</h3>
                                <div className="space-y-2 text-sm text-stone-600">
                                    <div className="flex justify-between items-center">
                                        <span>Date</span>
                                        <span className="font-medium">{startTime.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Time</span>
                                        <span className="font-medium">
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {booking.guests?.length > 0 && (
                                        <div className="flex justify-between items-start">
                                            <span>Guests</span>
                                            <div className="text-right">
                                                {booking.guests.map((guest: any, index: number) => (
                                                    <div key={index} className="font-medium">{guest.email}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {booking.additional_notes && (
                                        <div className="flex justify-between items-start">
                                            <span>Notes</span>
                                            <div className="text-right max-w-[60%] font-medium">{booking.additional_notes}</div>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span>Amount</span>
                                        <span className="font-bold">250 USDC</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="terms"
                                        checked={isChecked}
                                        onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                                    />
                                    <label htmlFor="terms" className="text-sm text-stone-600">
                                        I agree to the terms and conditions
                                    </label>
                                </div>

                                <Button
                                    onClick={() => handlePayment(booking)}
                                    disabled={!isChecked || ['pending', 'confirming'].includes(transactionState)}
                                    className="w-full"
                                >
                                    {transactionState === 'pending' ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending Transaction...
                                        </div>
                                    ) : transactionState === 'confirming' ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Confirming Transaction...
                                        </div>
                                    ) : (
                                        'Pay 250 USDC'
                                    )}
                                </Button>
                                {transactionState === 'error' && (
                                    <div className="mt-2 text-sm text-red-500 text-center">
                                        Transaction failed. Please try again.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default function Payment() {
    const [isChecked, setIsChecked] = useState(false);
    const [showPaymentSheet, setShowPaymentSheet] = useState(false);
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [selectedForDialog, setSelectedForDialog] = useState<any>(null);
    const [userFid, setUserFid] = useState<number | null>(null);
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [historyBookings, setHistoryBookings] = useState<any[]>([]);
    const [paymentHash, setPaymentHash] = useState<`0x${string}` | undefined>();
    const [transactionState, setTransactionState] = useState<TransactionState>('idle');

    const { address, isConnected } = useAccount();
    const { writeContractAsync: writeContractAsyncBase } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
        hash: paymentHash,
    });

    // Effect to handle transaction state changes
    useEffect(() => {
        if (isConfirming) {
            setTransactionState('confirming');
        } else if (isConfirmed) {
            setTransactionState('confirmed');
        } else if (confirmError) {
            setTransactionState('error');
            console.error('Transaction confirmation error:', confirmError);
        }
    }, [isConfirming, isConfirmed, confirmError]);

    // Get FID.
    useEffect(() => {
        const initializeSDK = async () => {
            const context = await sdk.context;
            if (context.user?.fid) {
                setUserFid(context.user.fid);
            }
        };
        initializeSDK();
    }, []);

    // Load bookings.
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

    // Handle payment
    const handlePayment = useCallback(async (booking: any) => {
        if (!address || !userFid) {
            console.error('No address or FID available');
            return;
        }

        const paymentAmount = parseUnits('250', USDC_DECIMALS);

        try {
            setTransactionState('pending');

            const hash = await writeContractAsyncBase({
                address: USDC_ADDRESS,
                abi: [{
                    inputs: [
                        { name: "recipient", type: "address" },
                        { name: "amount", type: "uint256" }
                    ],
                    name: "transfer",
                    outputs: [{ name: "", type: "bool" }],
                    stateMutability: "nonpayable",
                    type: "function"
                }],
                functionName: "transfer",
                args: [TARGET_ADDRESS, paymentAmount],
            });

            setPaymentHash(hash);
            console.log('Payment transaction sent:', hash);

        } catch (error) {
            console.error('Payment error:', error);
            setTransactionState('error');
        }
    }, [address, userFid, writeContractAsyncBase]);

    // Effect to handle successful payment
    useEffect(() => {
        if (transactionState === 'confirmed' && paymentHash && selectedForDialog) {
            const updateBookingAndNotify = async () => {
                try {
                    // Update booking status
                    const { error: updateError } = await supabase
                        .from('cal_bookings')
                        .update({
                            status: 'confirmed',
                            tx_hash: paymentHash
                        })
                        .eq('booking_id', selectedForDialog.booking_id);

                    if (updateError) {
                        console.error('Error updating booking status:', updateError);
                        return;
                    }

                    // Send notification
                    try {
                        const context = await sdk.context;
                        if (context.user?.fid) {
                            const formattedDate = new Date(selectedForDialog.start_time).toLocaleDateString();
                            const formattedTime = new Date(selectedForDialog.start_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                            
                            await fetch("/api/notifications", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Skip-Rate-Limit": "true",
                                },
                                body: JSON.stringify({
                                    fid: context.user.fid,
                                    notificationId: `payment:${paymentHash}`,
                                    title: "Payment Confirmed! 💰",
                                    body: `Your payment of 250 USDC for ${formattedDate} at ${formattedTime} is confirmed. Check your calendar for details.`,
                                    priority: "high"
                                }),
                            });
                        }
                    } catch (notifError) {
                        console.error('Failed to send payment notification:', notifError);
                    }

                    // Update UI
                    setPendingBookings(prev => prev.filter(booking => booking.booking_id !== selectedForDialog.booking_id));
                    setHistoryBookings(prev => [...prev, { ...selectedForDialog, status: 'confirmed', tx_hash: paymentHash }]);
                    
                } catch (error) {
                    console.error('Error in payment completion:', error);
                    setTransactionState('error');
                }
            };

            updateBookingAndNotify();
        }
    }, [transactionState, paymentHash, selectedForDialog]);

    // Handle card click.
    const handleCardClick = useCallback((booking: any) => {
        setSelectedForDialog(booking);
        if (booking.status === 'pending') {
            setShowPaymentSheet(true);
        } else {
            setShowBookingDialog(true);
        }
    }, [setSelectedForDialog, setShowPaymentSheet, setShowBookingDialog]);

    useEffect(() => {
        // Directly show payment sheet if connected.  No approval needed.
        if (isConnected && selectedForDialog?.status === "pending") {
            setShowPaymentSheet(true);
        }
    }, [isConnected, selectedForDialog]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background overflow-y-auto pb-24">
            <div className="container max-w-md mx-auto p-4">
                <div className="space-y-4 mb-16">
                    {pendingBookings.map((booking) => (
                        <PendingBookingCard
                            key={booking.booking_id}
                            booking={booking}
                            isChecked={isChecked && selectedForDialog?.booking_id === booking.booking_id}
                            onCheckChange={(checked) => {
                                setIsChecked(checked);
                                if (checked) {
                                    setSelectedForDialog(booking);
                                } else {
                                    setSelectedForDialog(null)
                                    setShowPaymentSheet(false); // Reset on uncheck
                                }
                            }}
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
                                <p className="text-sm font-medium">Date</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(selectedForDialog?.start_time || "").toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Time</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(selectedForDialog?.start_time || "").toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </p>
                            </div>
                            {selectedForDialog?.name && (
                                <div>
                                    <p className="text-sm font-medium">Name</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedForDialog.name}
                                    </p>
                                </div>
                            )}
                            {selectedForDialog?.email && (
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedForDialog.email}
                                    </p>
                                </div>
                            )}
                            {selectedForDialog?.guests?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium">Guests</p>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedForDialog.guests.map((guest: any, index: number) => (
                                            <div key={index}>{guest.email}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedForDialog?.additional_notes && (
                                <div>
                                    <p className="text-sm font-medium">Notes</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedForDialog.additional_notes}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <p className="text-sm text-muted-foreground">
                                    {selectedForDialog?.status}
                                </p>
                            </div>
                            {selectedForDialog?.tx_hash && (
                                <div>
                                    <p className="text-sm font-medium">Transaction</p>
                                    <a
                                        href={`https://basescan.org/tx/${selectedForDialog.tx_hash}`}
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
                            <Button onClick={() => setShowBookingDialog(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Payment Sheet */}
                {selectedForDialog && selectedForDialog.status === 'pending' && (
                    <PaymentSheet
                        booking={selectedForDialog}
                        isChecked={isChecked}
                        setIsChecked={setIsChecked}
                        transactionState={transactionState}
                        setTransactionState={setTransactionState}
                        handlePayment={handlePayment}
                        open={showPaymentSheet}
                        onOpenChange={setShowPaymentSheet}
                        setSelectedForDialog={setSelectedForDialog}
                        setShowPaymentSheet={setShowPaymentSheet}
                    />
                )}
            </div>
        </div>
    );
}