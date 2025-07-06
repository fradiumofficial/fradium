import Safe from '../../assets/safe.svg'

interface SafetyCardProps {
  confidence: number;
}

export function SafetyCard({ confidence }: SafetyCardProps) {
  return (
    <div className="w-full max-w-md bg-gradient-to-b from-[#4A834C] to-[#35373E] p-6 mt-[20px]">
      <div className="flex items-center gap-4">
        {/* Icon Section */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img src={Safe} alt="Address Safe" />
          </div>
        </div>

        {/* Text Section */}
        <div className="flex flex-col">
          <h3 className="text-[14px] font-semibold uppercase tracking-wider">
            Address Is Safe
          </h3>
          <p className="text-[12px] font-medium text-white">
            Confidence: {confidence}%
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <p className="text-white/70 font-normal text-[14px]">
          This bitcoin address appears to be clean with no suspicious activity detected in our comprehensive database.
        </p>
      </div>
    </div>
  );
}
