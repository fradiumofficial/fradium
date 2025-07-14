import Safe from '../../assets/safe.svg'
import Danger from '../../assets/danger.svg';

interface SafetyCardProps {
  confidence: string;
  title: string;
}

interface DangerCardProps {
  confidence: string;
}

export function SafetyCard({ 
  confidence,
  title
}: SafetyCardProps) {
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
            {title} Is Safe
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

export function DangerCard({ confidence }: DangerCardProps) {
  return (
    <div className="w-full max-w-md bg-gradient-to-b from-[#834A4A] to-[#3E3535] p-6 mt-[20px]">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="relative">
            <img src={Danger} alt="Address Dangerous" />
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-[14px] font-semibold uppercase tracking-wider">
            Address Is Risky
          </h3>
          <p className="text-[12px] font-medium text-white">
            Confidence: {confidence}%
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-white/70 font-normal text-[14px]">
          This bitcoin address shows suspicious patterns. Exercise caution when interacting with this address.
        </p>
      </div>
    </div>
  );
}