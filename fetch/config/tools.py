tools = [
    {
        "type": "function",
        "function": {
            "name": "help",
            "description": "Gets help with the agent.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_coin_price",
            "description": "Gets the price of a given coin type.",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin_type": {"type": "string"},
                    "amount": {"type": "number"}
                },
            },
            "required": ["coin_type", "amount"],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "function": {
            "name": "get_bitcoin_address",
            "description": "Gets the bitcoin address of the user.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ethereum_address",
            "description": "Gets the ethereum address of the user.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_solana_address",
            "description": "Gets the solana address of the user.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_icp_address",
            "description": "Gets the ICP address of the user.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_bitcoin_balance",
            "description": "Gets the balance of a given coin type.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ethereum_balance",
            "description": "Gets the balance of a given coin type.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_solana_balance",
            "description": "Gets the balance of a given coin type.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_icp_balance",
            "description": "Gets the balance of ICP.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_solana",
            "description": "Sends solana coin from my wallet to a specified address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destinationAddress": {
                        "type": "string",
                        "description": "The destination solana address."
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send in solana."
                    }
                },
                "required": ["destinationAddress", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_icp",
            "description": "Sends ICP from my wallet to a specified address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destinationAddress": {
                        "type": "string",
                        "description": "The destination ICP address / principal."
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send in ICP."
                    }
                },
                "required": ["destinationAddress", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_bitcoin",
            "description": "Sends bitcoin coin from my wallet to a specified address.",
            "parameters": {
                "type": "object",
                "properties": { 
                    "destinationAddress": {
                        "type": "string",
                        "description": "The destination bitcoin address."
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send in bitcoin."
                    }
                },
                "required": ["destinationAddress", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_ethereum",
            "description": "Sends ethereum coin from my wallet to a specified address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destinationAddress": {
                        "type": "string",
                        "description": "The destination ethereum address."
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send in ethereum."
                    }
                },
                "required": ["destinationAddress", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_icp",
            "description": "Sends ICP from my wallet to a specified address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "destinationAddress": {
                        "type": "string",
                        "description": "The destination ICP address."
                    },
                    "amount": {
                        "type": "number",
                        "description": "Amount to send in ICP."
                    }
                },
                "required": ["destinationAddress", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "buy_crypto",
            "description": "Buy crypto using fiat. Provide coin type and token amount, and you will receive a payment link.",
            "parameters": {
                "type": "object",
                "properties": {
                    "coinType": {"type": "string", "description": "One of: btc, eth, sol, icp"},
                    "amount": {"type": "number", "description": "Token amount the user wants to buy (e.g., 0.2 BTC)."}
                },
                "required": ["coinType", "amount"],
                "additionalProperties": False
            }
        },
        "strict": True
    },
    {
        "type": "function",
        "function": {
            "name": "best_market_price",
            "description": "Gets the best market price for a given coin type.",
            "parameters": {
                "type": "object",
                "properties": {
                    "coin_from": {"type": "string", "description": "Example: BTC, ETH, SOL, ICP."},
                    "coin_to": {"type": "string", "description": "Example: USDT, USDC, USDC.e, USDC.e."},
                    "side": {"type": "string", "description": "The side of the trade (buy or sell)."},
                    "amount": {"type": "number", "description": "Token amount the user wants to buy (e.g., 0.2 BTC)."}
                },
                "required": ["coin_from", "coin_to", "side", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    }
]