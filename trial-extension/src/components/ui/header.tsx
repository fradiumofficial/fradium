import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { CheckIcon, CopyIcon } from "lucide-react";

interface ProfileHeaderProps {
  mainAvatarSrc: string;
  mainAvatarFallback: string;
  title: string;
  address: string;
  secondaryAvatarSrc: string;
  secondaryAvatarFallback: string;
  className?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  mainAvatarSrc,
  mainAvatarFallback,
  title,
  address,
  secondaryAvatarSrc,
  secondaryAvatarFallback,
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // Utility to truncate the address
  const truncateAddress = address.length > 4
    ? `${address.substring(0, 2)}..${address.substring(address.length - 2)}`
    : address;

  // Handle copying the address to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className={twMerge("flex flex-row justify-between items-center bg-[#1C1D22] p-4 w-full", className)}>
      {/* Left Section: Main Avatar */}
      <div className="flex-1 flex justify-start">
        <Avatar className="w-10 h-10 md:w-24 md:h-24">
          <AvatarImage src={mainAvatarSrc} alt="Main user avatar" />
          <AvatarFallback>{mainAvatarFallback}</AvatarFallback>
        </Avatar>
      </div>

      {/* Center Section: Title and Address */}
      <div className="flex-1 flex flex-col items-center justify-center text-white text-center">
        <h1 className="text-[14px] font-medium">{title}</h1>
        <div 
          className="flex flex-row items-center space-x-2 cursor-pointer mt-1 group"
          onClick={handleCopy}
        >
          <p className="text-sm text-[#777777] group-hover:text-white transition-colors">
            {truncateAddress}
          </p>
          {isCopied ? (
            <CheckIcon className="w-[14px] h-[14px] text-green-500" />
          ) : (
            <CopyIcon className="w-[14px] h-[14px] text-[#777777] group-hover:text-white transition-colors" />
          )}
        </div>
      </div>

      {/* Right Section: Secondary Avatar */}
      <div className="flex-1 flex justify-end">
        <Avatar className="w-10 h-10 md:w-12 md:h-12">
          <AvatarImage src={secondaryAvatarSrc} alt="Secondary user avatar" />
          <AvatarFallback>{secondaryAvatarFallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default ProfileHeader;