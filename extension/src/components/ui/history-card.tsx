import { Separator } from "./separator";


interface HistoryCardProps {
  icon: string;
  address: string;
  category: string;
  date: string;
  onClick?: () => void;
  index: number;
}

const HistoryCard: React.FC<HistoryCardProps> = ({icon, address, category, date, onClick, index}) => {
  return (
    <div key={index} className="w-full mb-4">
      <div className="flex flex-row justify-between items-center w-full pb-5">
        <img src={icon} alt="Ethereum" className="pe-4"/>
        <div className="size-10 flex flex-col text-left grow-4">
          <p className="text-white truncate border-1">{address}</p>
          <p className="text-white/50">{category}</p>
        </div>
        <p className="grow-3 text-end text-white/70">{date}</p>
      </div>
      <Separator />
    </div>
  );
}

export default HistoryCard;