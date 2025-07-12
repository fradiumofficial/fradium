import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { CheckIcon, CopyIcon } from "lucide-react";

interface ProfileHeaderProps {
  mainAvatarSrc: string;
  mainAvatarFallback: string;
  address: string;
  className?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  mainAvatarSrc,
  mainAvatarFallback,
  address
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
    <div className="flex flex-row items-center bg-[#1C1D22] p-4 w-full">
      <div className="flex justify-start">
        <Avatar className="w-10 h-10 md:w-24 md:h-24">
          <AvatarImage src={mainAvatarSrc} alt="Main user avatar" />
          <AvatarFallback>{mainAvatarFallback}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 flex flex-row space-x-2 text-center justify-center group items-start" onClick={handleCopy}>
        <p className="text-sm text-[#777777] group-hover:text-white transition-colors">
          {truncateAddress}
        </p>
        {isCopied ? (
          <CheckIcon className="w-[14px] h-[14px] text-green-500 mt-1" />
        ) : (
          <CopyIcon className="w-[14px] h-[14px] text-[#777777] group-hover:text-white transition-colors mt-1" />
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;