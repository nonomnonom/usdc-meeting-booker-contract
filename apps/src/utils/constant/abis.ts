export const ABI = [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [],
      name: "InvalidInitialization",
      type: "error"
    },
    {
      inputs: [],
      name: "NotInitializing", 
      type: "error"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "OwnableInvalidOwner",
      type: "error"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address"
        }
      ],
      name: "OwnableUnauthorizedAccount",
      type: "error"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint64",
          name: "version",
          type: "uint64"
        }
      ],
      name: "Initialized",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address"
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "OwnershipTransferred",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "paymentId",
          type: "uint256"
        },
        {
          indexed: true,
          internalType: "address",
          name: "payer",
          type: "address"
        },
        {
          indexed: false,
          internalType: "string",
          name: "fid",
          type: "string"
        },
        {
          indexed: false,
          internalType: "string",
          name: "name",
          type: "string"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "string[]",
          name: "guestEmails",
          type: "string[]"
        }
      ],
      name: "PaymentReceived",
      type: "event"
    },
    {
      inputs: [],
      name: "USDC",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_paymentId",
          type: "uint256"
        }
      ],
      name: "getPayment",
      outputs: [
        {
          internalType: "string",
          name: "name",
          type: "string"
        },
        {
          internalType: "string",
          name: "email",
          type: "string"
        },
        {
          internalType: "string",
          name: "additionalNotes",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "date",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "payer",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256"
        },
        {
          internalType: "string",
          name: "fid",
          type: "string"
        },
        {
          internalType: "string[]",
          name: "guestEmails",
          type: "string[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_fid",
          type: "string"
        },
        {
          internalType: "string",
          name: "_name",
          type: "string"
        },
        {
          internalType: "string",
          name: "_email",
          type: "string"
        },
        {
          internalType: "string",
          name: "_additionalNotes",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "_date",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256"
        },
        {
          internalType: "string[]",
          name: "_guestEmails",
          type: "string[]"
        }
      ],
      name: "makeUSDCPayment",
      outputs: [],
      stateMutability: "payable",
      type: "function"
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      name: "payments",
      outputs: [
        {
          internalType: "string",
          name: "fid",
          type: "string"
        },
        {
          internalType: "string",
          name: "name",
          type: "string"
        },
        {
          internalType: "string",
          name: "email",
          type: "string"
        },
        {
          internalType: "string",
          name: "additionalNotes",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "date",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "payer",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "withdrawUSDC",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ] as const;
  
  export default ABI;