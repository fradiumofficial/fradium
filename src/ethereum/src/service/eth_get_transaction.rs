use std::{cell::{Cell, RefCell}, collections::BTreeMap, time::Duration};
use ic_cdk::spawn;
use ic_cdk_timers::set_timer_interval;
use candid::{CandidType, Deserialize};
use serde::Serialize;
use alloy::{
    primitives::{Address, B256, b256, U256},
    providers::{Provider, ProviderBuilder, RootProvider},
    rpc::types::{eth::{Filter, Log}, FilterBlockOption, ValueOrArray},
    transports::icp::{IcpConfig, IcpTransport},
};
use alloy::hex;
use alloy::rpc::types::FilterSet;
use crate::get_rpc_service;

// ====== Konfigurasi realtime ======
const CONFIRMATIONS: u64 = 6;        // hindari reorg ringan
const SCAN_BATCH: u64 = 500;         // jumlah blok per tick (untuk berjaga bila timer telat)
const TICK_SECS: u64 = 10;           // interval timer
const MAX_RPC_BODY: u64 = 1_000_000; // batas respons RPC yang lebih longgar

// ========== Storage sederhana ==========
#[derive(Clone, Debug)]
pub enum AssetKind {
    Eth,
    Erc20 { contract: Address }
}

#[derive(Clone, Debug)]
pub struct TxRecord {
    pub hash: B256,
    pub block_number: u64,
    pub timestamp: u64,
    pub from: Address,
    pub to: Option<Address>,
    pub value_wei: U256,
    pub kind: AssetKind,
    pub inbound: bool,
}

// DTO buat Candid
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub enum AssetKindDto {
    Eth,
    Erc20 { contract: String },
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct TxRecordDto {
    pub hash: String,
    pub block_number: u64,
    pub timestamp: u64,
    pub from: String,
    pub to: Option<String>,
    pub value_wei: String,
    pub kind: AssetKindDto,
    pub inbound: bool,
}

fn to_dto(rec: &TxRecord) -> TxRecordDto {
    let kind = match &rec.kind {
        AssetKind::Eth => AssetKindDto::Eth,
        AssetKind::Erc20 { contract } => AssetKindDto::Erc20 {
            contract: format!("0x{}", hex::encode(contract.as_slice())),
        },
    };
    TxRecordDto {
        hash: format!("0x{}", hex::encode(rec.hash.as_slice())),
        block_number: rec.block_number,
        timestamp: rec.timestamp,
        from: format!("0x{}", hex::encode(rec.from.as_slice())),
        to: rec.to.map(|a| format!("0x{}", hex::encode(a.as_slice()))),
        value_wei: rec.value_wei.to_string(),
        kind,
        inbound: rec.inbound,
    }
}

thread_local! {
    static LAST_SCANNED: Cell<u64> = Cell::new(0);               // block terakhir yang diproses
    static HISTORY: RefCell<BTreeMap<Address, Vec<TxRecord>>> = RefCell::new(BTreeMap::new());
    static WATCHED: RefCell<Vec<Address>> = RefCell::new(vec![]);
    // Rangkaian blok yang sudah discan (disimpan sebagai rentang agar hemat memori)
    // Invariant: v tidak overlap dan berurutan; setiap (a,b) merepresentasikan a..=b
    static SCANNED_RANGES: RefCell<Vec<(u64,u64)>> = RefCell::new(vec![]);
}

// Helper: topic dari address utk filter ERC20 (left-pad ke 32 byte)
fn addr_topic(a: Address) -> B256 {
    let mut t = [0u8; 32];
    t[12..].copy_from_slice(a.as_slice());
    B256::from(t)
}

#[ic_cdk::update]
pub fn watch_address(addr: String) -> Result<(), String> {
    let a = Address::parse_checksummed(addr.clone(), None)
        .or_else(|_| addr.parse::<Address>())
        .map_err(|e| e.to_string())?;
    WATCHED.with(|w| {
        let mut v = w.borrow_mut();
        if !v.contains(&a) { v.push(a); }
    });
    Ok(())
}

#[ic_cdk::update]
pub fn unwatch_address(addr: String) -> Result<(), String> {
    let a = Address::parse_checksummed(addr.clone(), None)
        .or_else(|_| addr.parse::<Address>())
        .map_err(|e| e.to_string())?;
    WATCHED.with(|w| {
        let mut v = w.borrow_mut();
        v.retain(|x| *x != a);
    });
    Ok(())
}

#[ic_cdk::query]
pub fn get_watched() -> Vec<String> {
    WATCHED.with(|w| w.borrow().iter().map(|a| format!("0x{}", hex::encode(a.as_slice()))).collect())
}

#[ic_cdk::init]
fn init() {
    ic_cdk::println!("init realtime watcher");
    set_timer_interval(Duration::from_secs(TICK_SECS), || spawn(indexer_tick()));
}

#[ic_cdk::update]
pub fn start_with_interval_secs(secs: u64) {
    let secs = Duration::from_secs(secs);
    ic_cdk::println!("Timer canister: Starting a new timer with {secs:?} interval...");
    ic_cdk_timers::set_timer_interval(secs, || ic_cdk::spawn(indexer_tick()));
}

#[ic_cdk::update]
pub async fn get_latest_block() -> u64 {
    let rpc = IcpConfig::new(get_rpc_service()).set_max_response_size(MAX_RPC_BODY);
    let provider: RootProvider<IcpTransport> = ProviderBuilder::new().on_icp(rpc);
    match provider.get_block_number().await { Ok(n) => n, Err(_) => 0 }
}

// ===== Inti realtime: proses hanya blok terbaru, tanpa backfill =====
async fn indexer_tick() {
    let rpc = IcpConfig::new(get_rpc_service()).set_max_response_size(MAX_RPC_BODY);
    let provider: RootProvider<IcpTransport> = ProviderBuilder::new().on_icp(rpc);

    // kalau belum ada alamat dipantau, lewati
    let watched_len = WATCHED.with(|w| w.borrow().len());
    if watched_len == 0 { ic_cdk::println!("tick: no watched addresses"); return; }

    // head saat ini
    let latest = match provider.get_block_number().await {
        Ok(n) => n,
        Err(e) => { ic_cdk::println!("get_block_number err: {e:?}"); return; }
    };

    // hindari reorg: hanya proses sampai latest - CONFIRMATIONS
    let safe_head = latest.saturating_sub(CONFIRMATIONS);
    if safe_head == 0 { return; }

    // tentukan rentang proses
    let (start, end, first_run) = LAST_SCANNED.with(|c| {
        let last = c.get();
        if last == 0 {
            // FIRST RUN: tidak ada backfill — langsung set ke safe_head dan keluar
            c.set(safe_head);
            (0, 0, true)
        } else {
            let mut s = last + 1;
            let mut e = safe_head.min(s + SCAN_BATCH - 1);
            if e < s { (0, 0, false) } else { (s, e, false) }
        }
    });

    if first_run { ic_cdk::println!("tick: first run, set LAST_SCANNED={safe_head}, no backfill"); return; }
    if start == 0 { return; }

    ic_cdk::println!("tick: scanning {start}..={end} (watched={watched_len})");

    if let Err(e) = scan_eth_txs(&provider, start, end).await {
        ic_cdk::println!("scan_eth_txs error: {e}");
    }
    if let Err(e) = scan_erc20_logs(&provider, start, end).await {
        ic_cdk::println!("scan_erc20_logs error: {e}");
    }

    // catat rentang blok yang sukses diproses
    record_scanned_range(start, end);

    LAST_SCANNED.with(|c| c.set(end));
}

async fn scan_eth_txs(provider: &RootProvider<IcpTransport>, start: u64, end: u64) -> Result<(), String> {
    use alloy::rpc::types::eth::{BlockTransactionsKind, BlockNumberOrTag, BlockTransactions};

    let watched = WATCHED.with(|w| w.borrow().clone());
    if watched.is_empty() { return Ok(()); }

    for n in start..=end {
        // Ambil blok (hash transaksi saja, hemat payload)
        let block = provider
            .get_block_by_number(BlockNumberOrTag::Number(n.into()), BlockTransactionsKind::Hashes.into())
            .await
            .map_err(|e| e.to_string())?
            .ok_or("block missing")?;

        let ts = block.header.timestamp;
        if let BlockTransactions::Hashes(hashes) = block.transactions {
            for h in hashes {
                if let Ok(opt_tx) = provider.get_transaction_by_hash(h).await {
                    if let Some(tx) = opt_tx {
                        let from = tx.from;
                        let to = tx.to;
                        let val = tx.value;

                        for who in &watched {
                            if Some(*who) == to || *who == from {
                                let rec = TxRecord {
                                    hash: h,
                                    block_number: n,
                                    timestamp: ts,
                                    from,
                                    to,
                                    value_wei: val,
                                    kind: AssetKind::Eth,
                                    inbound: Some(*who) == to,
                                };
                                append_history(*who, rec);
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

async fn scan_erc20_logs(provider: &RootProvider<IcpTransport>, start: u64, end: u64) -> Result<(), String> {
    use alloy::rpc::types::eth::BlockNumberOrTag;

    // topic0 signature Transfer(address,address,uint256)
    let transfer_sig = b256!("ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

    let watched = WATCHED.with(|w| w.borrow().clone());
    if watched.is_empty() { return Ok(()); }

    for who in watched {
        let who_topic = addr_topic(who);

        // Chunking adaptif untuk menghindari body limit
        let mut from_block = start;
        let mut window: u64 = 100; // ukuran awal jendela blok
        while from_block <= end {
            let to_block = (from_block + window - 1).min(end);

            // inbound: topic2 = who
            let mut inbound = Filter::new()
                .event_signature(transfer_sig)
                .select(FilterBlockOption::Range {
                    from_block: Some(BlockNumberOrTag::Number(from_block.into())),
                    to_block: Some(BlockNumberOrTag::Number(to_block.into())),
                });
            inbound.topics = [
                ValueOrArray::Value(transfer_sig).into(),
                FilterSet::default(),
                ValueOrArray::Value(who_topic).into(),
                FilterSet::default(),
            ];

            // outbound: topic1 = who
            let mut outbound = Filter::new()
                .event_signature(transfer_sig)
                .select(FilterBlockOption::Range {
                    from_block: Some(BlockNumberOrTag::Number(from_block.into())),
                    to_block: Some(BlockNumberOrTag::Number(to_block.into())),
                });
            outbound.topics = [
                ValueOrArray::Value(transfer_sig).into(),
                ValueOrArray::Value(who_topic).into(),
                FilterSet::default(),
                FilterSet::default(),
            ];

            // Coba ambil logs; jika body terlalu besar, perkecil window dan retry
            let try_fetch = async {
                let logs_in: Vec<Log> = provider.get_logs(&inbound).await.map_err(|e| e.to_string())?;
                let logs_out: Vec<Log> = provider.get_logs(&outbound).await.map_err(|e| e.to_string())?;
                Ok::<(Vec<Log>, Vec<Log>), String>((logs_in, logs_out))
            };

            match try_fetch.await {
                Ok((logs_in, logs_out)) => {
                    for lg in logs_in.into_iter().chain(logs_out) {
                        let (from, to) = (
                            Address::from_slice(&lg.topics()[1].as_slice()[12..]),
                            Address::from_slice(&lg.topics()[2].as_slice()[12..]),
                        );
                        let bytes = lg.data().data.0.clone();
                        let arr: [u8; 32] = bytes.as_ref().try_into().unwrap_or([0u8; 32]);
                        let amount = U256::from_be_bytes(arr);
                        let rec = TxRecord {
                            hash: lg.transaction_hash.unwrap_or_default(),
                            block_number: lg.block_number.unwrap_or_default().into(),
                            timestamp: lg.block_timestamp.unwrap_or_default(),
                            from,
                            to: Some(to),
                            value_wei: amount,
                            kind: AssetKind::Erc20 { contract: lg.address() },
                            inbound: to == who,
                        };
                        append_history(who, rec);
                    }
                    // sukses, majukan jendela
                    from_block = to_block.saturating_add(1);
                }
                Err(err) => {
                    // Jika body terlalu besar, perkecil window dan coba lagi
                    if err.contains("body exceeds size limit") || err.contains("Body exceeds size limit") {
                        if window > 1 {
                            window = (window / 2).max(1);
                            ic_cdk::println!("scan_erc20_logs: body too large, shrinking window to {window}");
                            continue; // retry dengan window lebih kecil pada rentang sama
                        } else {
                            // Sudah window 1 tapi masih gagal; lewati blok ini agar tidak buntu
                            ic_cdk::println!("scan_erc20_logs: skip block {from_block} due to body limit");
                            from_block = from_block.saturating_add(1);
                        }
                    } else {
                        return Err(err);
                    }
                }
            }
        }
    }
    Ok(())
}

fn append_history(owner: Address, rec: TxRecord) {
    HISTORY.with(|h| {
        let mut m = h.borrow_mut();
        m.entry(owner).or_default().push(rec);
    });
}

// Merge rentang baru ke SCANNED_RANGES (gabung jika saling bersinggungan/berurutan)
fn record_scanned_range(start: u64, end: u64) {
    if start == 0 || end < start { return; }
    SCANNED_RANGES.with(|r| {
        let mut v = r.borrow_mut();
        if let Some(last) = v.last_mut() {
            if start <= last.1 + 1 { // overlap atau bersebelahan
                last.1 = last.1.max(end);
                return;
            }
        }
        v.push((start, end));
    });
}

// Flatten rentang menjadi daftar blok (dengan paging)
fn flatten_ranges(limit: u64, offset: u64) -> Vec<u64> {
    let mut out = Vec::new();
    SCANNED_RANGES.with(|r| {
        let v = r.borrow();
        let mut skipped: u64 = 0;
        'outer: for (s, e) in v.iter() {
            let len = e - s + 1;
            if skipped + len <= offset { skipped += len; continue; }
            let start_take = if offset > skipped { s + (offset - skipped) } else { *s };
            for b in start_take..=*e {
                out.push(b);
                if out.len() as u64 >= limit { break 'outer; }
            }
            skipped = skipped + len;
        }
    });
    out
}

// API baca riwayat (paged)
#[ic_cdk::query]
pub fn get_history(addr: String, limit: u64, offset: u64) -> Result<Vec<TxRecordDto>, String> {
    let who = Address::parse_checksummed(addr.clone(), None)
        .or_else(|_| addr.parse::<Address>())
        .map_err(|e| e.to_string())?;
    let data = HISTORY.with(|h| h.borrow().get(&who).cloned().unwrap_or_default());
    let len = data.len();
    let offset_usize = (offset as usize).min(len);
    let end = ((offset + limit) as usize).min(len);
    let slice = &data[offset_usize..end];
    Ok(slice.iter().map(to_dto).collect())
}


// API: blok-blok yang sudah discan (return array of u64). Gunakan paging biar aman.
#[ic_cdk::query]
pub fn get_scanned_blocks(limit: u64, offset: u64) -> Vec<u64> {
    let lim = limit.max(1).min(10_000); // guard agar tidak terlalu besar
    flatten_ranges(lim, offset)
}

// Opsional: lihat rentang yang tersimpan (hemat memori untuk inspeksi/debug)
#[ic_cdk::query]
pub fn get_scanned_ranges() -> Vec<(u64,u64)> {
    SCANNED_RANGES.with(|r| r.borrow().clone())
}
