export type Payment = {
  id: number;
  name: string;
  email: string;
  additionalNotes: string;
  date: number;
  payer: string;
  amount: bigint;
  fid: string;
  guestEmails: string[];
  bookingId?: string; // Reference to Cal.com booking
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
};

export type PaymentRequest = {
  fid: string;
  name: string;
  email: string;
  additionalNotes: string;
  date: number;
  amount: bigint;
  guestEmails: string[];
  bookingId?: string;
};

export type PaymentResponse = {
  success: boolean;
  transactionHash?: string;
  error?: string;
  payment?: Payment;
};
