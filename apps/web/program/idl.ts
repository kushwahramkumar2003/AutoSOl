export const idl = {
  address: "sg8bwyw6qvK923nNjieJFcJVrwCGWo3XBJGkC1fkt9Z",
  metadata: {
    name: "auto_sol",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "cancel_payment_schedule",
      discriminator: [247, 11, 247, 22, 50, 82, 144, 58],
      accounts: [
        {
          name: "payment_schedule",
          writable: true,
        },
        {
          name: "owner",
          writable: true,
          signer: true,
        },
        {
          name: "payment_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "payment_vault_authority",
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
            ],
          },
        },
        {
          name: "owner_token_account",
          writable: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [],
    },
    {
      name: "create_payment_schedule",
      discriminator: [2, 29, 246, 1, 117, 214, 46, 131],
      accounts: [
        {
          name: "payment_schedule",
          writable: true,
          signer: true,
        },
        {
          name: "user",
          writable: true,
          signer: true,
        },
        {
          name: "user_token_account",
          writable: true,
        },
        {
          name: "mint",
        },
        {
          name: "payment_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "payment_vault_authority",
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
            ],
          },
        },
        {
          name: "fee_vault",
        },
        {
          name: "fee_vault_token_account",
          writable: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
        {
          name: "rent",
          address: "SysvarRent111111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "payment_amount",
          type: "u64",
        },
        {
          name: "recipient",
          type: "pubkey",
        },
        {
          name: "schedule_times",
          type: {
            vec: "i64",
          },
        },
        {
          name: "memo",
          type: "string",
        },
      ],
    },
    {
      name: "execute_payment",
      discriminator: [86, 4, 7, 7, 120, 139, 232, 139],
      accounts: [
        {
          name: "payment_schedule",
          writable: true,
        },
        {
          name: "payment_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
              {
                kind: "const",
                value: [118, 97, 117, 108, 116],
              },
            ],
          },
        },
        {
          name: "payment_vault_authority",
          pda: {
            seeds: [
              {
                kind: "account",
                path: "payment_schedule",
              },
            ],
          },
        },
        {
          name: "recipient_token_account",
          writable: true,
        },
        {
          name: "keeper",
          writable: true,
          signer: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      args: [
        {
          name: "payment_index",
          type: "u64",
        },
      ],
    },
    {
      name: "initialize",
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        {
          name: "fee_vault",
          writable: true,
          signer: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "update_fee_percentage",
      discriminator: [102, 119, 197, 160, 139, 102, 182, 0],
      accounts: [
        {
          name: "fee_vault",
          writable: true,
        },
        {
          name: "authority",
          writable: true,
          signer: true,
        },
      ],
      args: [
        {
          name: "new_fee_percentage",
          type: "u16",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "FeeVault",
      discriminator: [192, 178, 69, 232, 58, 149, 157, 132],
    },
    {
      name: "PaymentSchedule",
      discriminator: [220, 252, 154, 129, 139, 124, 204, 75],
    },
  ],
  events: [
    {
      name: "FeePercentageUpdatedEvent",
      discriminator: [159, 56, 203, 216, 111, 194, 177, 206],
    },
    {
      name: "PaymentExecutedEvent",
      discriminator: [71, 65, 49, 77, 198, 22, 227, 182],
    },
    {
      name: "PaymentScheduleCancelledEvent",
      discriminator: [87, 114, 182, 97, 125, 1, 183, 110],
    },
    {
      name: "PaymentScheduleCreatedEvent",
      discriminator: [43, 244, 87, 216, 27, 10, 99, 229],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "EmptySchedule",
      msg: "Payment schedule cannot be empty",
    },
    {
      code: 6001,
      name: "InvalidScheduleTime",
      msg: "Schedule time must be in the future",
    },
    {
      code: 6002,
      name: "InsufficientFunds",
      msg: "Insufficient funds for scheduled payments and fees",
    },
    {
      code: 6003,
      name: "InvalidScheduleStatus",
      msg: "Payment schedule is not active",
    },
    {
      code: 6004,
      name: "InvalidPaymentIndex",
      msg: "Invalid payment index",
    },
    {
      code: 6005,
      name: "PaymentAlreadyExecuted",
      msg: "Payment has already been executed",
    },
    {
      code: 6006,
      name: "PaymentNotDue",
      msg: "Payment is not due yet",
    },
    {
      code: 6007,
      name: "InsufficientVaultFunds",
      msg: "Insufficient funds in payment vault",
    },
    {
      code: 6008,
      name: "NoRemainingFunds",
      msg: "No remaining funds to refund",
    },
    {
      code: 6009,
      name: "FeeTooHigh",
      msg: "Fee percentage cannot exceed 5%",
    },
  ],
  types: [
    {
      name: "FeePercentageUpdatedEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "old_percentage",
            type: "u16",
          },
          {
            name: "new_percentage",
            type: "u16",
          },
          {
            name: "updated_at",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "FeeVault",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "pubkey",
          },
          {
            name: "fee_percentage",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "Payment",
      type: {
        kind: "struct",
        fields: [
          {
            name: "scheduled_time",
            type: "i64",
          },
          {
            name: "executed",
            type: "bool",
          },
          {
            name: "execution_time",
            type: "i64",
          },
          {
            name: "tx_signature",
            type: {
              option: "pubkey",
            },
          },
        ],
      },
    },
    {
      name: "PaymentExecutedEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "schedule_id",
            type: "pubkey",
          },
          {
            name: "payment_index",
            type: "u64",
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "recipient",
            type: "pubkey",
          },
          {
            name: "executed_at",
            type: "i64",
          },
          {
            name: "executed_by",
            type: "pubkey",
          },
        ],
      },
    },
    {
      name: "PaymentSchedule",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "pubkey",
          },
          {
            name: "total_amount",
            type: "u64",
          },
          {
            name: "remaining_amount",
            type: "u64",
          },
          {
            name: "payment_amount",
            type: "u64",
          },
          {
            name: "recipient",
            type: "pubkey",
          },
          {
            name: "payments",
            type: {
              vec: {
                defined: {
                  name: "Payment",
                },
              },
            },
          },
          {
            name: "created_at",
            type: "i64",
          },
          {
            name: "status",
            type: {
              defined: {
                name: "ScheduleStatus",
              },
            },
          },
          {
            name: "memo",
            type: "string",
          },
        ],
      },
    },
    {
      name: "PaymentScheduleCancelledEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "schedule_id",
            type: "pubkey",
          },
          {
            name: "owner",
            type: "pubkey",
          },
          {
            name: "refund_amount",
            type: "u64",
          },
          {
            name: "cancelled_at",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "PaymentScheduleCreatedEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "schedule_id",
            type: "pubkey",
          },
          {
            name: "owner",
            type: "pubkey",
          },
          {
            name: "recipient",
            type: "pubkey",
          },
          {
            name: "total_amount",
            type: "u64",
          },
          {
            name: "payment_amount",
            type: "u64",
          },
          {
            name: "payment_count",
            type: "u64",
          },
          {
            name: "created_at",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "ScheduleStatus",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Active",
          },
          {
            name: "Completed",
          },
          {
            name: "Cancelled",
          },
        ],
      },
    },
  ],
};
