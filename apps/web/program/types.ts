/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/auto_sol.json`.
 */
export type AutoSol = {
  address: "sg8bwyw6qvK923nNjieJFcJVrwCGWo3XBJGkC1fkt9Z";
  metadata: {
    name: "autoSol";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "cancelPaymentSchedule";
      discriminator: [247, 11, 247, 22, 50, 82, 144, 58];
      accounts: [
        {
          name: "paymentSchedule";
          writable: true;
        },
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "paymentVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
            ];
          };
        },
        {
          name: "paymentVaultAuthority";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
            ];
          };
        },
        {
          name: "ownerTokenAccount";
          writable: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [];
    },
    {
      name: "createPaymentSchedule";
      discriminator: [2, 29, 246, 1, 117, 214, 46, 131];
      accounts: [
        {
          name: "paymentSchedule";
          writable: true;
          signer: true;
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "userTokenAccount";
          writable: true;
        },
        {
          name: "mint";
        },
        {
          name: "paymentVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
            ];
          };
        },
        {
          name: "paymentVaultAuthority";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
            ];
          };
        },
        {
          name: "feeVault";
        },
        {
          name: "feeVaultTokenAccount";
          writable: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "paymentAmount";
          type: "u64";
        },
        {
          name: "recipient";
          type: "pubkey";
        },
        {
          name: "scheduleTimes";
          type: {
            vec: "i64";
          };
        },
        {
          name: "memo";
          type: "string";
        },
      ];
    },
    {
      name: "executePayment";
      discriminator: [86, 4, 7, 7, 120, 139, 232, 139];
      accounts: [
        {
          name: "paymentSchedule";
          writable: true;
        },
        {
          name: "paymentVault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
            ];
          };
        },
        {
          name: "paymentVaultAuthority";
          pda: {
            seeds: [
              {
                kind: "account";
                path: "paymentSchedule";
              },
            ];
          };
        },
        {
          name: "recipientTokenAccount";
          writable: true;
        },
        {
          name: "keeper";
          writable: true;
          signer: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [
        {
          name: "paymentIndex";
          type: "u64";
        },
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "feeVault";
          writable: true;
          signer: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "updateFeePercentage";
      discriminator: [102, 119, 197, 160, 139, 102, 182, 0];
      accounts: [
        {
          name: "feeVault";
          writable: true;
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
      ];
      args: [
        {
          name: "newFeePercentage";
          type: "u16";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "feeVault";
      discriminator: [192, 178, 69, 232, 58, 149, 157, 132];
    },
    {
      name: "paymentSchedule";
      discriminator: [220, 252, 154, 129, 139, 124, 204, 75];
    },
  ];
  events: [
    {
      name: "feePercentageUpdatedEvent";
      discriminator: [159, 56, 203, 216, 111, 194, 177, 206];
    },
    {
      name: "paymentExecutedEvent";
      discriminator: [71, 65, 49, 77, 198, 22, 227, 182];
    },
    {
      name: "paymentScheduleCancelledEvent";
      discriminator: [87, 114, 182, 97, 125, 1, 183, 110];
    },
    {
      name: "paymentScheduleCreatedEvent";
      discriminator: [43, 244, 87, 216, 27, 10, 99, 229];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "emptySchedule";
      msg: "Payment schedule cannot be empty";
    },
    {
      code: 6001;
      name: "invalidScheduleTime";
      msg: "Schedule time must be in the future";
    },
    {
      code: 6002;
      name: "insufficientFunds";
      msg: "Insufficient funds for scheduled payments and fees";
    },
    {
      code: 6003;
      name: "invalidScheduleStatus";
      msg: "Payment schedule is not active";
    },
    {
      code: 6004;
      name: "invalidPaymentIndex";
      msg: "Invalid payment index";
    },
    {
      code: 6005;
      name: "paymentAlreadyExecuted";
      msg: "Payment has already been executed";
    },
    {
      code: 6006;
      name: "paymentNotDue";
      msg: "Payment is not due yet";
    },
    {
      code: 6007;
      name: "insufficientVaultFunds";
      msg: "Insufficient funds in payment vault";
    },
    {
      code: 6008;
      name: "noRemainingFunds";
      msg: "No remaining funds to refund";
    },
    {
      code: 6009;
      name: "feeTooHigh";
      msg: "Fee percentage cannot exceed 5%";
    },
  ];
  types: [
    {
      name: "feePercentageUpdatedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "oldPercentage";
            type: "u16";
          },
          {
            name: "newPercentage";
            type: "u16";
          },
          {
            name: "updatedAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "feeVault";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "pubkey";
          },
          {
            name: "feePercentage";
            type: "u16";
          },
        ];
      };
    },
    {
      name: "payment";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scheduledTime";
            type: "i64";
          },
          {
            name: "executed";
            type: "bool";
          },
          {
            name: "executionTime";
            type: "i64";
          },
          {
            name: "txSignature";
            type: {
              option: "pubkey";
            };
          },
        ];
      };
    },
    {
      name: "paymentExecutedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scheduleId";
            type: "pubkey";
          },
          {
            name: "paymentIndex";
            type: "u64";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "recipient";
            type: "pubkey";
          },
          {
            name: "executedAt";
            type: "i64";
          },
          {
            name: "executedBy";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "paymentSchedule";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "totalAmount";
            type: "u64";
          },
          {
            name: "remainingAmount";
            type: "u64";
          },
          {
            name: "paymentAmount";
            type: "u64";
          },
          {
            name: "recipient";
            type: "pubkey";
          },
          {
            name: "payments";
            type: {
              vec: {
                defined: {
                  name: "payment";
                };
              };
            };
          },
          {
            name: "createdAt";
            type: "i64";
          },
          {
            name: "status";
            type: {
              defined: {
                name: "scheduleStatus";
              };
            };
          },
          {
            name: "memo";
            type: "string";
          },
        ];
      };
    },
    {
      name: "paymentScheduleCancelledEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scheduleId";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "refundAmount";
            type: "u64";
          },
          {
            name: "cancelledAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "paymentScheduleCreatedEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "scheduleId";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "recipient";
            type: "pubkey";
          },
          {
            name: "totalAmount";
            type: "u64";
          },
          {
            name: "paymentAmount";
            type: "u64";
          },
          {
            name: "paymentCount";
            type: "u64";
          },
          {
            name: "createdAt";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "scheduleStatus";
      type: {
        kind: "enum";
        variants: [
          {
            name: "active";
          },
          {
            name: "completed";
          },
          {
            name: "cancelled";
          },
        ];
      };
    },
  ];
};
