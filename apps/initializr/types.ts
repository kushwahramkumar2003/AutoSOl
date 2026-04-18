/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/auto_sol.json`.
 */
export type AutoSol = {
  "address": "G4zWuZQ7SaP9VgE7bhucKgQ7MVWjLVBhL4wHK6ymVAQL",
  "metadata": {
    "name": "autoSol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addExecutor",
      "discriminator": [
        195,
        90,
        42,
        209,
        244,
        246,
        76,
        18
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
          "name": "executor",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addFeeCollector",
      "discriminator": [
        232,
        239,
        208,
        45,
        79,
        48,
        18,
        169
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
          "name": "feeCollector",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addWhitelistedMint",
      "discriminator": [
        197,
        167,
        100,
        8,
        245,
        152,
        234,
        87
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
          "name": "mint",
          "type": "pubkey"
        }
      ]
    },
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
      "name": "cancelSplPaymentSchedule",
      "discriminator": [
        156,
        206,
        163,
        83,
        188,
        163,
        64,
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
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
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
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "createSplPaymentSchedule",
      "discriminator": [
        91,
        45,
        70,
        87,
        103,
        235,
        249,
        196
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
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
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
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "feeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
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
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "feeVaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "executeSplPayment",
      "discriminator": [
        123,
        191,
        66,
        237,
        163,
        25,
        68,
        172
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
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "paymentVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
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
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
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
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "removeExecutor",
      "discriminator": [
        220,
        155,
        16,
        109,
        21,
        139,
        129,
        190
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
          "name": "executor",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeFeeCollector",
      "discriminator": [
        244,
        215,
        198,
        72,
        40,
        193,
        29,
        236
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
          "name": "feeCollector",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeWhitelistedMint",
      "discriminator": [
        179,
        228,
        123,
        93,
        88,
        212,
        96,
        186
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
          "name": "mint",
          "type": "pubkey"
        }
      ]
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
    },
    {
      "name": "withdrawSplFees",
      "discriminator": [
        67,
        45,
        141,
        82,
        211,
        167,
        149,
        115
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
          "name": "authorityTokenAccount",
          "writable": true
        },
        {
          "name": "feeVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
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
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "feeVaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "msg": "Empty schedule"
    },
    {
      "code": 6001,
      "name": "invalidScheduleTime",
      "msg": "Schedule time must be in the future"
    },
    {
      "code": 6002,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6003,
      "name": "invalidScheduleStatus",
      "msg": "Schedule is not active"
    },
    {
      "code": 6004,
      "name": "invalidPaymentIndex",
      "msg": "Invalid payment index"
    },
    {
      "code": 6005,
      "name": "paymentAlreadyExecuted",
      "msg": "Payment already executed"
    },
    {
      "code": 6006,
      "name": "paymentNotDue",
      "msg": "Payment not due yet"
    },
    {
      "code": 6007,
      "name": "insufficientVaultFunds",
      "msg": "Insufficient vault funds"
    },
    {
      "code": 6008,
      "name": "noRemainingFunds",
      "msg": "No remaining funds"
    },
    {
      "code": 6009,
      "name": "feeTooHigh",
      "msg": "Fee > 5%"
    },
    {
      "code": 6010,
      "name": "unauthorizedExecutor",
      "msg": "Unauthorized executor"
    },
    {
      "code": 6011,
      "name": "unauthorizedFeeWithdrawal",
      "msg": "Unauthorized fee withdrawal"
    },
    {
      "code": 6012,
      "name": "tooManyScheduleTimes",
      "msg": "Too many schedule times (max 10)"
    },
    {
      "code": 6013,
      "name": "invalidRecipient",
      "msg": "Invalid recipient"
    },
    {
      "code": 6014,
      "name": "unauthorizedCancellation",
      "msg": "Unauthorized cancellation"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6016,
      "name": "invalidPaymentType",
      "msg": "Wrong payment type"
    },
    {
      "code": 6017,
      "name": "mintNotWhitelisted",
      "msg": "Mint not whitelisted"
    },
    {
      "code": 6018,
      "name": "whitelistFull",
      "msg": "Whitelist full"
    },
    {
      "code": 6019,
      "name": "mintAlreadyWhitelisted",
      "msg": "Mint already whitelisted"
    },
    {
      "code": 6020,
      "name": "mintNotInWhitelist",
      "msg": "Mint not in whitelist"
    },
    {
      "code": 6021,
      "name": "executorAllowlistFull",
      "msg": "Executor allowlist full"
    },
    {
      "code": 6022,
      "name": "feeCollectorAllowlistFull",
      "msg": "Fee collector allowlist full"
    },
    {
      "code": 6023,
      "name": "executorAlreadyAllowed",
      "msg": "Executor already allowed"
    },
    {
      "code": 6024,
      "name": "feeCollectorAlreadyAllowed",
      "msg": "Fee collector already allowed"
    },
    {
      "code": 6025,
      "name": "executorNotAllowed",
      "msg": "Executor not allowed"
    },
    {
      "code": 6026,
      "name": "feeCollectorNotAllowed",
      "msg": "Fee collector not allowed"
    },
    {
      "code": 6027,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6028,
      "name": "zeroAmount",
      "msg": "Zero amount"
    },
    {
      "code": 6029,
      "name": "memoTooLong",
      "msg": "Memo too long"
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
            "name": "whitelistedMints",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "executorAllowedKeys",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "feeCollectorAllowedKeys",
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
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "withdrawnBy",
            "type": "pubkey"
          },
          {
            "name": "withdrawnAt",
            "type": "i64"
          },
          {
            "name": "isSol",
            "type": "bool"
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
            "name": "executedBy",
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
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "executedAt",
            "type": "i64"
          },
          {
            "name": "executedBy",
            "type": "pubkey"
          },
          {
            "name": "isSol",
            "type": "bool"
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
            "name": "mint",
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
            "name": "paymentType",
            "type": {
              "defined": {
                "name": "paymentType"
              }
            }
          },
          {
            "name": "memo",
            "type": "string"
          },
          {
            "name": "vaultBump",
            "type": "u8"
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
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "refundAmount",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "i64"
          },
          {
            "name": "isSol",
            "type": "bool"
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
            "name": "mint",
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
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "paymentCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isSol",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "paymentType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          },
          {
            "name": "splToken"
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
