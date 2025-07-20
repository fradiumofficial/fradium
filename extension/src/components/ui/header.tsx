import Logo from '../../assets/logo.svg';

const ProfileHeader = () => {

  return (
    <div className="flex flex-row items-center bg-[#1C1D22] p-4 w-full">
      <div className="flex justify-start">
        <img src={Logo} alt="Logo" />
      </div>
    </div>
  );
};

export default ProfileHeader;