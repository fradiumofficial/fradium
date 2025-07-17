import React, { useState } from "react";
import WalletLayout from "../core/components/layouts/wallet-layout";
import NeoButton from "../core/components/SidebarButton";
import TransactionButton from "../core/components/TransactionButton";
import CustomButton from "../core/components/custom-button-a";
import AnalysisProgressModal from "../core/components/AnalysisProgressModal";

const tokens = [
  {
    icon: "/assets/bitcoin.svg",
    name: "BTC",
    symbol: "Bitcoin",
    desc: "Bitcoin • Internet Computer",
    amount: 0,
    value: "$0.00",
  },
  {
    icon: "/assets/eth.svg",
    name: "ETH",
    symbol: "Ethereum",
    desc: "Ethereum • Internet Computer • Base",
    amount: 0,
    value: "$0.00",
  },
  {
    icon: "/assets/fum.svg",
    name: "FUM",
    symbol: "Fradium",
    desc: "Ethereum • Internet Computer • Base",
    amount: 0,
    value: "$0.00",
  },
];

export default function TransactionPage() {
  const [openReceive, setOpenReceive] = useState(false);
  const [qrDetail, setQrDetail] = useState({ open: false, coin: null });
  const [openSend, setOpenSend] = useState({ open: false, coin: null });
  const [sendForm, setSendForm] = useState({ address: "", amount: "" });
  const [showAnalyzeProgress, setShowAnalyzeProgress] = useState(false);
  const [showSendResultSafe, setShowSendResultSafe] = useState(false);
  const [showSendResultDanger, setShowSendResultDanger] = useState(false);
  const [showSuccessSend, setShowSuccessSend] = useState(false);

  const qrImages = {
    Bitcoin: "/assets/images/qr-bitcoin.png",
    Ethereum: "/assets/images/qr-bitcoin.png", // ganti jika ada qr-eth.png
    Fradium: "/assets/images/qr-bitcoin.png", // ganti jika ada qr-fradium.png
  };
  const receiveAddresses = [
    { label: "Bitcoin", address: "m1psqxsfsn3efndfm1psqxsfsnfd723bu7an" },
    { label: "Ethereum", address: "m1psqxsfsn3efndfm1psqxsfsnfd723bu7an" },
    { label: "Fradium", address: "m1psqxsfsn3efndfm1psqxsfsnfd723bu7an" },
  ];

    return (
        <WalletLayout>
            <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
                {/* Card Wallet pakai gambar utuh */}
                <div className="relative items-center max-w-full w-full mx-auto">
                    <img
                        src="/assets/cek-card-wallet.png"
                        alt="Wallet Card"
                        className="block w-full max-w-full h-auto select-none pointer-events-none"
                        draggable="false"
                    />
                    {/* Overlay Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-20 pb-8">
                        <div className="text-white text-xs md:text-xs font-normal mb-1">Total Portofolio Value</div>
                        <div className="text-white text-4xl md:text-4xl font-semibold mb-1">$0.00</div>
                        <div className="text-green-400 text-sm font-medium mb-6 text-center">Top up your wallet to start using it!</div>
                        <div className="flex gap-8 w-full max-w-lg justify-center">
                            {/* Receive */}
                            <div className="flex flex-col flex-1">
                                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                                    <div className="absolute top-4 right-4">
                                        <TransactionButton
                                            icon="/assets/icons/received.svg"
                                            iconSize="w-6 h-6"
                                            onClick={() => setOpenReceive(true)}
                                        />
                                    </div>
                                    <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Receive</div>
                                </div>
                            </div>
                            {/* Send */}
                            <div className="flex flex-col flex-1">
                                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                                    <div className="absolute top-4 right-4">
                                        <TransactionButton
                                            icon="/assets/icons/send.svg"
                                            iconSize="w-6 h-6"
                                            onClick={() => setOpenSend({ open: true, coin: 'Bitcoin' })}
                                        />
                                    </div>
                                    <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Send</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Token List */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Tokens</h2>
                        <div className="flex gap-4">
                            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
                            <img src="/assets/icons/page_info.svg" alt="Setting" className="w-5 h-5 cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex flex-col divide-y divide-[#23272F]">
                        {tokens.map((token, idx) => (
                            <div key={idx} className="flex items-center px-2 py-4 gap-4">
                                <img src={token.icon} alt={token.name} className="w-10 h-10" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-semibold text-base">{token.name}</span>
                                        {token.symbol && <span className="text-[#B0B6BE] text-base">• {token.symbol}</span>}
                                        {token.fullname && <span className="text-[#B0B6BE] text-base">• {token.fullname}</span>}
                                    </div>
                                    <div className="text-[#B0B6BE] text-sm truncate">{token.desc}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-white font-semibold text-base">{token.amount}</span>
                                    <span className="text-[#B0B6BE] text-sm">{token.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-white text-4xl md:text-4xl font-semibold mb-1">
              $0.00
            </div>
            <div className="text-green-400 text-sm font-medium mb-6 text-center">
              Top up your wallet to start using it!
            </div>
            <div className="flex gap-8 w-full max-w-lg justify-center">
              {/* Receive */}
              <div className="flex flex-col flex-1">
                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                  <div className="absolute top-4 right-4">
                    <NeoButton
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="11"
                            height="11"
                            fill="#0E1117"
                          />
                        </svg>
                      }
                      className="!w-10 !h-10 p-0 flex items-center justify-center"
                      onClick={() => setOpenReceive(true)}
                    />
                  </div>
                  <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">
                    Receive
                  </div>
                </div>
              </div>
              {/* Send */}
              <div className="flex flex-col flex-1">
                <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                  <div className="absolute top-4 right-4">
                    <NeoButton
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <mask
                            id="mask-send"
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="15"
                            height="15"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="15"
                              height="15"
                              fill="#fff"
                            />
                          </mask>
                          <g mask="url(#mask-send)">
                            <path
                              d="M12 3V10H10.8V5.8L3.5 13.1L2.9 12.5L10.2 5.2H5V3H12Z"
                              fill="#0E1117"
                            />
                          </g>
                        </svg>
                      }
                      className="!w-10 !h-10 p-0 flex items-center justify-center"
                      onClick={() =>
                        setOpenSend({ open: true, coin: "Bitcoin" })
                      }
                    />
                  </div>
                  <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">
                    Send
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Token List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Tokens</h2>
            <div className="flex gap-4">
              <img
                src="/assets/icons/search.svg"
                alt="Search"
                className="w-5 h-5 cursor-pointer"
              />
              <img
                src="/assets/icons/page_info.svg"
                alt="Setting"
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex flex-col divide-y divide-[#23272F]">
            {tokens.map((token, idx) => (
              <div key={idx} className="flex items-center px-2 py-4 gap-4">
                <img src={token.icon} alt={token.name} className="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-base">
                      {token.name}
                    </span>
                    {token.symbol && (
                      <span className="text-[#B0B6BE] text-base">
                        • {token.symbol}
                      </span>
                    )}
                    {token.fullname && (
                      <span className="text-[#B0B6BE] text-base">
                        • {token.fullname}
                      </span>
                    )}
                  </div>
                  <div className="text-[#B0B6BE] text-sm truncate">
                    {token.desc}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white font-semibold text-base">
                    {token.amount}
                  </span>
                  <span className="text-[#B0B6BE] text-sm">{token.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Modal Receive Coin */}
      {openReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-md rounded-lg shadow-lg relative flex flex-col gap-6">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => setOpenReceive(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">
              Receive Coin
            </div>
            <div className="flex flex-col gap-4">
              {receiveAddresses.map((item, idx) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="text-white text-sm font-medium">
                    {item.label}:
                  </div>
                  <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                    <span className="text-[#B0B6BE] text-sm truncate flex-1">
                      {item.address}
                    </span>
                    <img
                      src="/assets/icons/qr_code.svg"
                      alt="QR"
                      className="w-5 h-5 cursor-pointer"
                      onClick={() =>
                        setQrDetail({ open: true, coin: item.label })
                      }
                    />
                    <img
                      src="/assets/icons/content_copy.svg"
                      alt="Copy"
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
            <CustomButton
              className="mt-2 w-full"
              onClick={() => setOpenReceive(false)}
            >
              Done
            </CustomButton>
          </div>
        </div>
      )}
      {/* Modal QR Detail Receive */}
      {qrDetail.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => setQrDetail({ open: false, coin: null })}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">
              Receive {qrDetail.coin}
            </div>
            <div className="flex flex-col items-center gap-2">
              <img
                src={qrImages[qrDetail.coin]}
                alt="QR"
                className="w-40 h-40 object-contain bg-black rounded"
              />
              <div className="text-[#B0B6BE] text-sm">
                Scan to receive {qrDetail.coin}
              </div>
            </div>
            <div>
              <div className="text-[#B0B6BE] text-sm mb-1">
                Your {qrDetail.coin && qrDetail.coin.toLowerCase()} address:
              </div>
              <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded px-3 py-2">
                <span className="text-[#B0B6BE] text-sm truncate flex-1">
                  {
                    receiveAddresses.find((a) => a.label === qrDetail.coin)
                      ?.address
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <CustomButton
                icon="/assets/icons/content_copy.svg"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(
                    receiveAddresses.find((a) => a.label === qrDetail.coin)
                      ?.address || ""
                  );
                }}
              >
                Copy Address
              </CustomButton>
              <NeoButton
                icon="/assets/icons/share.svg"
                className="!w-12 !h-12 flex items-center justify-center"
                onClick={() => {
                  /* share logic */
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal Send Coin */}
      {openSend.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#23272F] px-6 py-8 w-full max-w-sm rounded-lg shadow-lg relative flex flex-col gap-6">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold"
              onClick={() => setOpenSend({ open: false, coin: null })}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-white text-xl font-semibold mb-2">
              Send {openSend.coin}
            </div>
            <div className="flex flex-col items-center gap-2">
              <img
                src="/assets/images/image-send-coin.png"
                alt="Send Coin"
                className="w-32 h-32 object-contain"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">
                  Recipient Address
                </div>
                <input
                  type="text"
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none"
                  placeholder="ex: m1psqxsfsn3efndfm1psqxsfsnfn"
                  value={sendForm.address}
                  onChange={(e) =>
                    setSendForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div>
                <div className="text-[#B0B6BE] text-sm mb-1">
                  Amount ({openSend.coin?.toUpperCase() || ""})
                </div>
                <input
                  type="number"
                  className="w-full bg-[#23272F] border border-[#393E4B] rounded px-3 py-2 text-[#B0B6BE] text-sm outline-none"
                  placeholder="0.00"
                  value={sendForm.amount}
                  onChange={(e) =>
                    setSendForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
            </div>
            <CustomButton
              icon="/assets/icons/analyze-address-light.svg"
              className="mt-2 w-full justify-center"
              onClick={() => setShowAnalyzeProgress(true)}
            >
              Analyze Address
            </CustomButton>
          </div>
        </div>
      )}
      {/* Modal Progress Analyze Address */}
      <AnalysisProgressModal
        open={showAnalyzeProgress}
        onClose={() => {
          setShowAnalyzeProgress(false);
          setShowSendResultSafe(true);
        }}
      />
      {/* Modal Hasil Analisis Negatif (Address Not Safe) */}
      {showSendResultDanger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#25262B] max-w-[391px] w-full h-[630px] rounded-lg shadow-lg">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold z-20"
              onClick={() => setShowSendResultDanger(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="overflow-y-auto h-full p-6">
              <div className="text-white text-2xl font-semibold mb-6">
                Send {openSend.coin}
              </div>
              <div className="w-full flex flex-col gap-6 relative z-10">
                {/* Status Danger */}
                <div className="rounded-lg overflow-hidden mb-2 bg-white/5">
                  {/* Bagian atas dengan gradient */}
                  <div className="relative w-full">
                    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#F87171] via-transparent to-transparent opacity-80 z-0" />
                    <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                      <img
                        src="/assets/icons/danger.png"
                        alt="Danger"
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <div className="text-white font-bold text-lg leading-tight">
                          ADDRESS IS NOT SAFE
                        </div>
                        <div className="text-[#B0B6BE] text-sm">
                          Confidence: 96%
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bagian bawah deskripsi */}
                  <div className="px-6 pb-4">
                    <div className="text-[#B0B6BE] text-xs font-normal">
                      This bitcoin address appears to be flagged with suspicious
                      activity detected in our comprehensive database
                    </div>
                  </div>
                </div>
                {/* Address Details */}
                <p className="text-white font-semibold text-lg">
                  Address Details
                </p>
                <div className=" rounded-lg p-4 mb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        1
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/wallet-grey.svg"
                          alt="Wallet"
                          className="w-4 h-4"
                        />
                        Transactions
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        0.8 BTC
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/total-volume.svg"
                          alt="Total Volume"
                          className="w-4 h-4"
                        />
                        Total Volume
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-red-400 text-base font-medium">
                        89/100
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/risk-score.svg"
                          alt="Risk Score"
                          className="w-4 h-4"
                        />
                        Risk Score
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        329 Days Ago
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/last-activity.svg"
                          alt="Last Activity"
                          className="w-4 h-4"
                        />
                        Last Activity
                      </span>
                    </div>
                  </div>
                </div>
                {/* Security Checks */}
                <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#F87171] relative overflow-hidden bg-white/5">
                  <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#F87171]/30 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-white font-bold mb-2">
                      Security Checks Not Passed
                    </div>
                    <ul className="flex flex-col gap-1">
                      <li className="flex items-center gap-2 text-[#F87171] text-sm">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" fill="#F87171" />
                          <path
                            d="M8 12l2 2 4-4"
                            stroke="#23272F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-white">
                          No link to known scam addressed
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[#F87171] text-sm">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" fill="#F87171" />
                          <path
                            d="M8 12l2 2 4-4"
                            stroke="#23272F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-white">
                          Suspicious transaction pattern detected
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Button Confirm Send & Cancel */}
                <div className="flex gap-2 mt-2">
                  <CustomButton
                    className="w-full justify-center"
                    onClick={() => {
                      setShowSendResultDanger(false);
                      setShowSuccessSend(true);
                    }}
                  >
                    Confirm Send
                  </CustomButton>
                  <NeoButton
                    className="w-full text-white justify-center"
                    onClick={() => setShowSendResultDanger(false)}
                  >
                    Cancel
                  </NeoButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Hasil Analisis Aman (Address Safe) */}
      {showSendResultSafe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#25262B] max-w-[391px] w-full h-[630px] rounded-lg shadow-lg">
            <button
              className="absolute top-4 right-4 text-[#B0B6BE] hover:text-white text-2xl font-bold z-20"
              onClick={() => setShowSendResultSafe(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="overflow-y-auto h-full p-6">
              <div className="text-white text-2xl font-semibold mb-6">
                Send {openSend.coin}
              </div>
              <div className="w-full flex flex-col gap-6 relative z-10">
                {/* Status Safe */}
                <div className="rounded-lg overflow-hidden mb-2 bg-white/5">
                  {/* Bagian atas dengan gradient */}
                  <div className="relative w-full">
                    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#22C55E] via-transparent to-transparent opacity-80 z-0" />
                    <div className="relative flex items-center gap-4 px-6 py-5 z-10">
                      <img
                        src="/assets/icons/safe.png"
                        alt="Safe"
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <div className="text-white font-bold text-lg leading-tight">
                          ADDRESS IS SAFE
                        </div>
                        <div className="text-[#B0B6BE] text-sm">
                          Confidence: 96%
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bagian bawah deskripsi */}
                  <div className="px-6 pb-4">
                    <div className="text-[#B0B6BE] text-xs font-normal">
                      This bitcoin address appears to be clean with no
                      suspicious activity detected in our comprehensive database
                    </div>
                  </div>
                </div>
                {/* Address Details */}
                <p className="text-white font-semibold text-lg">
                  Address Details
                </p>
                <div className=" rounded-lg p-4 mb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        296
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/wallet-grey.svg"
                          alt="Wallet"
                          className="w-4 h-4"
                        />
                        Transactions
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        89.98 BTC
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/total-volume.svg"
                          alt="Total Volume"
                          className="w-4 h-4"
                        />
                        Total Volume
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-green-400 text-base font-medium">
                        17/100
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/risk-score.svg"
                          alt="Risk Score"
                          className="w-4 h-4"
                        />
                        Risk Score
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-3 flex flex-col">
                      <span className="text-white text-base font-medium">
                        17 Days Ago
                      </span>
                      <span className="text-[#B0B6BE] text-xs flex items-center gap-1 mt-1">
                        <img
                          src="/assets/icons/last-activity.svg"
                          alt="Last Activity"
                          className="w-4 h-4"
                        />
                        Last Activity
                      </span>
                    </div>
                  </div>
                </div>
                {/* Security Checks */}
                <div className="rounded-lg px-6 py-5 mb-2 border-l-2 border-[#22C55E] relative overflow-hidden bg-white/5">
                  <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#22C55E]/30 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-white font-bold mb-2">
                      Security Checks Passed
                    </div>
                    <ul className="flex flex-col gap-1">
                      <li className="flex items-center gap-2 text-[#22C55E] text-sm">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" fill="#22C55E" />
                          <path
                            d="M8 12l2 2 4-4"
                            stroke="#23272F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-white">
                          No links to known scam addressed
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-[#22C55E] text-sm">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" fill="#22C55E" />
                          <path
                            d="M8 12l2 2 4-4"
                            stroke="#23272F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-white">
                          No suspicious transaction pattern detected
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Button Confirm Send */}
                <div className="flex gap-2 mt-2">
                  <CustomButton
                    className="w-full justify-center"
                    onClick={() => {
                      setShowSendResultSafe(false);
                      setShowSuccessSend(true);
                    }}
                  >
                    Confirm Send
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Success Send */}
      {showSuccessSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#25262B] max-w-[400px] w-full rounded-lg shadow-lg p-8 flex flex-col items-center gap-6">
            {/* Success Icon */}
            <div className="flex items-center justify-center mb-2">
              <img
                src="/assets/images/succes-send.png"
                alt="Success Send"
                className="w-32 h-32 object-contain"
              />
            </div>

            {/* Success Text */}
            <div className="text-center">
              <h2 className="text-green-400 text-xl font-bold mb-2">
                SUCCESS SEND!
              </h2>
              <p className="text-[#B0B6BE] text-sm">
                YOUR TRANSACTION WAS SUCCESSFUL!
              </p>
            </div>

            {/* OK Button */}
            <CustomButton
              className="w-full max-w-[200px] justify-center"
              onClick={() => setShowSuccessSend(false)}
            >
              OK
            </CustomButton>
          </div>
        </div>
      )}
    </WalletLayout>
  );
}
