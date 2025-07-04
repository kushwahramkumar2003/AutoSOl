/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/auto_sol.json`.
 */
export type AutoSol = {
  "address": "98g9uR7WZqinAnSeUgB5nUw3pbR6sNwFuYWW78yPHtva",
  "metadata": {
    "name": "autoSol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelPaymentSchedule",
      "discriminator": [
        247,
        11,
        247,
        22,
        50,
        82,
        144,
        58
      ],
      "accounts": [
        {
          "name": "paymentSchedule",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "solPaymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "paymentSchedule"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createPaymentSchedule",
      "discriminator": [
        2,
        29,
        246,
        1,
        117,
        214,
        46,
        131
      ],
      "accounts": [
        {
          "name": "paymentSchedule",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "solPaymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "paymentSchedule"
              }
            ]
          }
        },
        {
          "name": "solFeeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentAmount",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "scheduleTimes",
          "type": {
            "vec": "i64"
          }
        },
        {
          "name": "memo",
          "type": "string"
        }
      ]
    },
    {
      "name": "executePayment",
      "discriminator": [
        86,
        4,
        7,
        7,
        120,
        139,
        232,
        139
      ],
      "accounts": [
        {
          "name": "paymentSchedule",
          "writable": true
        },
        {
          "name": "feeSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "solPaymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "paymentSchedule"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "feeSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "solFeeVault",
          "docs": [
            "Simple PDA without data structure for easy SOL transfers"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateFeePercentage",
      "discriminator": [
        102,
        119,
        197,
        160,
        139,
        102,
        182,
        0
      ],
      "accounts": [
        {
          "name": "feeSettings",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "feeSettings"
          ]
        }
      ],
      "args": [
        {
          "name": "newFeePercentage",
          "type": "u16"
        }
      ]
    },
    {
      "name": "withdrawFees",
      "discriminator": [
        198,
        212,
        171,
        109,
        144,
        215,
        174,
        89
      ],
      "accounts": [
        {
          "name": "feeSettings",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  115,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "solFeeVault",
          "docs": [
            "Simple PDA without data structure for easy SOL transfers"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "feeSettings",
      "discriminator": [
        251,
        152,
        237,
        9,
        118,
        2,
        153,
        254
      ]
    },
    {
      "name": "paymentSchedule",
      "discriminator": [
        220,
        252,
        154,
        129,
        139,
        124,
        204,
        75
      ]
    }
  ],
  "events": [
    {
      "name": "feePercentageUpdatedEvent",
      "discriminator": [
        159,
        56,
        203,
        216,
        111,
        194,
        177,
        206
      ]
    },
    {
      "name": "feesWithdrawnEvent",
      "discriminator": [
        93,
        177,
        0,
        69,
        15,
        156,
        73,
        194
      ]
    },
    {
      "name": "paymentExecutedEvent",
      "discriminator": [
        71,
        65,
        49,
        77,
        198,
        22,
        227,
        182
      ]
    },
    {
      "name": "paymentScheduleCancelledEvent",
      "discriminator": [
        87,
        114,
        182,
        97,
        125,
        1,
        183,
        110
      ]
    },
    {
      "name": "paymentScheduleCreatedEvent",
      "discriminator": [
        43,
        244,
        87,
        216,
        27,
        10,
        99,
        229
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "emptySchedule",
      "msg": "Payment schedule cannot be empty"
    },
    {
      "code": 6001,
      "name": "invalidScheduleTime",
      "msg": "Schedule time must be in the future"
    },
    {
      "code": 6002,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for scheduled payments and fees"
    },
    {
      "code": 6003,
      "name": "invalidScheduleStatus",
      "msg": "Payment schedule is not active"
    },
    {
      "code": 6004,
      "name": "invalidPaymentIndex",
      "msg": "Invalid payment index"
    },
    {
      "code": 6005,
      "name": "paymentAlreadyExecuted",
      "msg": "Payment has already been executed"
    },
    {
      "code": 6006,
      "name": "paymentNotDue",
      "msg": "Payment is not due yet"
    },
    {
      "code": 6007,
      "name": "insufficientVaultFunds",
      "msg": "Insufficient funds in payment vault"
    },
    {
      "code": 6008,
      "name": "noRemainingFunds",
      "msg": "No remaining funds to refund"
    },
    {
      "code": 6009,
      "name": "feeTooHigh",
      "msg": "Fee percentage cannot exceed 5%"
    },
    {
      "code": 6010,
      "name": "unauthorizedExecutor",
      "msg": "Only HTTP backend wallet can execute payments"
    },
    {
      "code": 6011,
      "name": "unauthorizedFeeWithdrawal",
      "msg": "Only authorized wallets can withdraw fees"
    },
    {
      "code": 6012,
      "name": "tooManyScheduleTimes",
      "msg": "Too many schedule times provided"
    },
    {
      "code": 6013,
      "name": "programAlreadyInitialized",
      "msg": "Program is already initialized"
    },
    {
      "code": 6014,
      "name": "invalidRecipient",
      "msg": "Invalid recipient for payment"
    },
    {
      "code": 6015,
      "name": "unauthorizedCancellation",
      "msg": "Unauthorized to cancel payment schedule"
    },
    {
      "code": 6016,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    }
  ],
  "types": [
    {
      "name": "feePercentageUpdatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "oldPercentage",
            "type": "u16"
          },
          {
            "name": "newPercentage",
            "type": "u16"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "feeSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "feePercentage",
            "type": "u16"
          },
          {
            "name": "httpBackendWallet",
            "type": "pubkey"
          },
          {
            "name": "feeWithdrawalAllowedKeys",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "feesWithdrawnEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "withdrawnBy",
            "type": "pubkey"
          },
          {
            "name": "withdrawnAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "payment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scheduledTime",
            "type": "i64"
          },
          {
            "name": "executed",
            "type": "bool"
          },
          {
            "name": "executionTime",
            "type": "i64"
          },
          {
            "name": "txSignature",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "paymentExecutedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scheduleId",
            "type": "pubkey"
          },
          {
            "name": "paymentIndex",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "executedAt",
            "type": "i64"
          },
          {
            "name": "executedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentSchedule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "remainingAmount",
            "type": "u64"
          },
          {
            "name": "paymentAmount",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "payments",
            "type": {
              "vec": {
                "defined": {
                  "name": "payment"
                }
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "scheduleStatus"
              }
            }
          },
          {
            "name": "memo",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "paymentScheduleCancelledEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scheduleId",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "paymentScheduleCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "scheduleId",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "paymentAmount",
            "type": "u64"
          },
          {
            "name": "paymentCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "scheduleStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    }
  ]
};
