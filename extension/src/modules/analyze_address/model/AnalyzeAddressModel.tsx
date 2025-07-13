// Blockchain Info Model Response
interface TransactionInput {
    prev_out?: {
        addr?: string;
        value: number;
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

// Mempool Space Model Response
export interface MempoolAddressTransaction {
    txid: string;
    status: {
        confirmed: boolean;
        block_height?: number;
        block_time?: number;
    }
    fee: number;
    vin: {
        txid: string;
        vout: number;
        prevout: {
            value: number;
            scriptpubkey_address?: string;
        }
    }[];
    vout: {
        value: number;
        scriptpubkey_address?: string;
    }[];
}