interface TransactionInput {
    prev_out?: {
        addr?: string;
        value?: number;
    }
}

interface TransactionOutput {
    addr?: string;
    value: number;
}

export interface Transaction {
    hash: string;
    block_height: number;
    fee: number;
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
}