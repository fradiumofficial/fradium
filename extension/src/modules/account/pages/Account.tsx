import ProfileHeader from "@/components/ui/header";

function Account() {
    return (
        <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md">
            <ProfileHeader />
            <div className="m-4 p-4">
                <h1 className="font-semibold text-[20px] text-white mb-2">Account</h1>
                <p className="text-white/60 text-sm">
                    Halaman akun masih dummy. Tambahkan detail profil, pengaturan, dan
                    preferensi di sini.
                </p>
            </div>
        </div>
    );
}

export default Account;


