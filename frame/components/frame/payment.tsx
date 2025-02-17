"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import sdk from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/db/supbase";
import { Loader2 } from "lucide-react";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC address mainet
const USDC_DECIMALS = 6; //  USDC decimals
const TARGET_ADDRESS = "0x7e176d20975760B849573e4b918C93ccdd9e32A4"; // Jake address

// Add transaction state type
type TransactionState = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

// Card components
const PendingBookingCard = ({ booking, onCardClick }: {
    booking: any;
    onCardClick: () => void;
}) => {
    const startTime = booking?.start_time ? new Date(booking.start_time) : null;
    const formattedDate = startTime && !isNaN(startTime.getTime())
        ? startTime.toLocaleDateString()
        : 'Date not available';
    const formattedTime = startTime && !isNaN(startTime.getTime())
        ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Time not available';

    return (
        <Card
            className="w-full max-w-sm mx-auto p-4 space-y-4 cursor-pointer hover:bg-stone-50"
            onClick={onCardClick}
        >
            <div className="space-y-1">
                <h2 className="text-xs uppercase text-muted-foreground">Booking Details</h2>
                <h1 className="text-xl font-bold">{booking?.event_type || "LIFE ADVICE (FRAME)"}</h1>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{formattedTime} -</span>
                </div>
                {booking?.organizer_name && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{booking.organizer_name}</span>
                    </div>
                )}
                {booking?.location && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{booking.location}</span>
                    </div>
                )}
            </div>

            {booking?.additional_notes && (
                <div className="pt-2 border-t border-muted">
                    <h3 className="text-sm font-medium mb-1">Notes:</h3>
                    <p className="text-sm text-muted-foreground">{booking.additional_notes}</p>
                </div>
            )}

            <div className="pt-2 border-t border-muted flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-500">pending</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCardClick();
                    }}
                    className="h-8 px-3 text-xs"
                >
                    Pay Now
                </Button>
            </div>
        </Card>
    );
};

const HistoryBookingCard = ({ booking, onCardClick }: {
    booking: any;
    onCardClick: () => void;
}) => {
    const startTime = new Date(booking?.start_time);
    const formattedTime = startTime && !isNaN(startTime.getTime())
        ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Time not available';

    return (
        <Card
            className="w-full max-w-sm mx-auto p-4 space-y-4 cursor-pointer hover:bg-stone-50"
            onClick={onCardClick}
        >
            <div className="space-y-1">
                <h2 className="text-xs uppercase text-muted-foreground">Booking Details</h2>
                <h1 className="text-xl font-bold">{booking?.event_type || "LIFE ADVICE (FRAME)"}</h1>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{startTime.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{formattedTime} -</span>
                </div>
                {booking?.organizer_name && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Host:</span>
                        <span>{booking.organizer_name}</span>
                    </div>
                )}
                {booking?.location && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{booking.location}</span>
                    </div>
                )}
            </div>

            {booking?.additional_notes && (
                <div className="pt-2 border-t border-muted">
                    <h3 className="text-sm font-medium mb-1">Notes:</h3>
                    <p className="text-sm text-muted-foreground">{booking.additional_notes}</p>
                </div>
            )}

            <div className="pt-2 border-t border-muted flex justify-between items-center">
                <span className={`text-sm font-medium ${booking.status === 'confirmed' ? 'text-green-600' : 'text-red-500'}`}>
                    {booking.status}
                </span>
                {booking.status === 'confirmed' && booking.tx_hash && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://sepolia.basescan.org//tx/${booking.tx_hash}`, '_blank');
                        }}
                    >
                        View tx
                    </Button>
                )}
            </div>
        </Card>
    );
};

const PaymentSheet = ({ booking, transactionState, handlePayment, open, onOpenChange }: {
    booking: any;
    transactionState: TransactionState;
    handlePayment: (booking: any) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    // Only allow closing if not in a processing state
    const canClose = !['pending', 'confirming'].includes(transactionState);

    useEffect(() => {
        if (!canClose) {
            onOpenChange(true); // Force sheet to stay open
        }
    }, [canClose, onOpenChange]);

    const startTime = new Date(booking.start_time);
   

    return (
        <Sheet open={open} onOpenChange={(newOpen) => canClose && onOpenChange(newOpen)}>
            <SheetContent side="bottom" className="max-h-[85%] overflow-y-auto">
                <div className="flex flex-col gap-6 pb-6">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-semibold">Confirm Payment</h3>
                        <div className="space-y-2 text-sm text-stone-600">
                            <div className="flex justify-between items-center">
                                <span>Date</span>
                                <span className="font-medium">{startTime.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Time</span>
                                <span className="font-medium">
                                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                  
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

                    <Button
                        onClick={() => handlePayment(booking)}
                        disabled={['pending', 'confirming'].includes(transactionState)}
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
            </SheetContent>
        </Sheet>
    );
};

export default function Payment() {
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

        const paymentAmount = parseUnits('125', USDC_DECIMALS);

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

                   // Send notifications
                    try {
                        const context = await sdk.context;
                        if (context.user?.fid) {
                            // Notification for the user who made the payment
                            const userNotificationData = {
                                fid: context.user.fid,
                                notificationId: `payment:${paymentHash}:user`,
                                title: "Payment Successful! 💰",
                                body: `Your payment of 250 USDC for booking on ${new Date(selectedForDialog.start_time).toLocaleDateString()} is confirmed.`,
                                targetUrl: `${process.env.NEXT_PUBLIC_URL}/payment?tx=${paymentHash}`,
                                priority: "high" as const
                            };

                            // **DO NOT SEND NOTIFICATION TO JAKE (FID: 1020) OR NONOM (FID: 196648)**

                            // Send notification only to the user
                            await fetch("/api/notifications", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Skip-Rate-Limit": "true",
                                },
                                body: JSON.stringify(userNotificationData)
                            });

                            console.log('Payment notification sent to user');
                        }
                    } catch (notifError) {
                        console.error('Failed to send payment notification:', notifError);
                    }


                    // Update UI
                    setPendingBookings(prev => prev.filter(booking => booking.booking_id !== selectedForDialog.booking_id));
                    setHistoryBookings(prev => [...prev, { ...selectedForDialog, status: 'confirmed', tx_hash: paymentHash }]);

                    // Reset states
                    setShowPaymentSheet(false);
                    setSelectedForDialog(null);
                    setTransactionState('idle');
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
    }, []);

    useEffect(() => {
        // Directly show payment sheet if connected.  No approval needed.
        if (isConnected && selectedForDialog?.status === "pending") {
            setShowPaymentSheet(true);
        }
    }, [isConnected, selectedForDialog]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background">
            <ScrollArea className="h-[calc(100vh-4rem)]">
                <div className="container max-w-md mx-auto p-4">
                    <div className="space-y-4 mb-16">
                        {pendingBookings.map((booking) => (
                            <PendingBookingCard
                                key={booking.booking_id}
                                booking={booking}
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
                                <div className="space-y-3">
                                    {selectedForDialog?.event_type && (
                                        <div>
                                            <p className="text-sm font-medium">Event Type</p>
                                            <p className="text-sm text-stone-600">{selectedForDialog.event_type}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium">Date & Time</p>
                                        <p className="text-sm text-stone-600">
                                            {new Date(selectedForDialog?.start_time || "").toLocaleDateString()},{' '}
                                            {new Date(selectedForDialog?.start_time || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                          
                                        </p>
                                    </div>

                                    {selectedForDialog?.name && (
                                        <div>
                                            <p className="text-sm font-medium">Booker Name</p>
                                            <p className="text-sm text-stone-600">{selectedForDialog.name}</p>
                                        </div>
                                    )}

                                    {selectedForDialog?.email && (
                                        <div>
                                            <p className="text-sm font-medium">Booker Email</p>
                                            <p className="text-sm text-stone-600">{selectedForDialog.email}</p>
                                        </div>
                                    )}

                                    {selectedForDialog?.organizer_name && (
                                        <div>
                                            <p className="text-sm font-medium">Host</p>
                                            <p className="text-sm text-stone-600">{selectedForDialog.organizer_name}</p>
                                        </div>
                                    )}

                                    {selectedForDialog?.location && (
                                        <div>
                                            <p className="text-sm font-medium">Location</p>
                                            <p className="text-sm text-stone-600">{selectedForDialog.location}</p>
                                        </div>
                                    )}

                                    {selectedForDialog?.guests?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium">Guests</p>
                                            <div className="space-y-1 mt-1">
                                                {selectedForDialog.guests.map((guest: any, index: number) => (
                                                    <p key={index} className="text-sm text-stone-600">{guest.email}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedForDialog?.additional_notes && (
                                        <div>
                                            <p className="text-sm font-medium">Additional Notes</p>
                                            <p className="text-sm text-stone-600 whitespace-pre-wrap">{selectedForDialog.additional_notes}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <p className={`text-sm font-medium ${selectedForDialog?.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'
                                            }`}>
                                            {selectedForDialog?.status}
                                        </p>
                                    </div>

                                    {selectedForDialog?.tx_hash && (
                                        <div>
                                            <p className="text-sm font-medium">Transaction</p>
                                            <a
                                                href={`https://sepolia.basescan.org//tx/${selectedForDialog.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                View on Basescan
                                            </a>
                                        </div>
                                    )}
                                </div>
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
                            transactionState={transactionState}
                            handlePayment={handlePayment}
                            open={showPaymentSheet}
                            onOpenChange={setShowPaymentSheet}
                        />
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
