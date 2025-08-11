Product Requirements Document Fradium

1. Latar Belakang
   Perkembangan ekonomi digital semakin pesat, ditandai dengan adopsi teknologi blockchain dan aset digital seperti cryptocurrency, NFT, dan smart contract di banyak negara, termasuk Indonesia. Transformasi ini membuka banyak peluang inovasi dan efisiensi dalam transaksi keuangan digital, namun juga membawa risiko baru yang tidak bisa diabaikan mulai dari penipuan (fraud), pencurian aset, kebocoran data, hingga maraknya aktivitas ilegal seperti judi online.
   Menurut Chainalysis Crypto Crime Report 2024, nilai kerugian akibat kejahatan di sektor aset digital secara global mencapai lebih dari $24,2 miliar sepanjang tahun 2023. Jenis kejahatan yang paling sering terjadi meliputi penipuan investasi (crypto scam), rug pull, phising, hingga pencurian dana melalui eksploitasi smart contract. Ancaman-ancaman ini bukan hanya terjadi di tingkat global, tetapi juga berdampak pada ekosistem digital di Asia Tenggara dan Indonesia, yang tercatat sebagai salah satu wilayah dengan pertumbuhan pengguna aset digital tercepat.
   Di sisi lain, literasi keamanan blockchain di kalangan masyarakat dan pengembang masih tergolong rendah. Banyak pengguna yang belum memahami cara mengenali smart contract berbahaya, memverifikasi reputasi wallet tujuan, atau membedakan transaksi yang sah dan ilegal. Kondisi ini memberikan peluang luas bagi pelaku kejahatan siber untuk menjalankan modus-modus penipuan baru, termasuk penyalahgunaan blockchain untuk aktivitas judi online dan pencucian uang.
   Dalam konteks inilah, Risk Management & Consumer Protection menjadi aspek kunci yang sangat krusial untuk mendukung pertumbuhan ekosistem ekonomi digital yang aman, terpercaya, dan berkelanjutan. Fradium hadir sebagai solusi inovatif untuk memberikan perlindungan nyata bagi konsumen, mendorong transparansi, serta meningkatkan keamanan dalam setiap transaksi aset digital.
2. Problem Statement
   Tingginya Angka Penipuan & Risiko Transaksi Blockchain:
   Laporan dari Chainalysis dan platform pelaporan seperti Chainabuse mengungkapkan bahwa secara global, kasus penipuan kripto seperti rug pull, phising, smart contract scam, dan pencurian aset digital masih terus meningkat. Kerugian yang dialami korban setiap tahunnya mencapai miliaran dolar AS, dan banyak terjadi karena pengguna tidak sadar telah berinteraksi dengan wallet atau smart contract ilegal.

Minimnya Sistem Deteksi Dini dan Perlindungan Konsumen:
Sebagian besar platform hanya mengandalkan edukasi pasif, tanpa tools deteksi real-time yang mudah diakses masyarakat umum. Hasilnya, korban sulit mengidentifikasi address berbahaya atau smart contract yang punya celah/backdoor.

Kurangnya Keterlibatan Komunitas dalam Pengawasan:
Belum ada sistem pelaporan dan validasi komunitas secara terpusat untuk memperbarui blacklist address, smart contract scam, atau wallet yang digunakan dalam aktivitas ilegal (termasuk judi online).
Dari permasalahan tersebut, timbul dampak berupa tingginya angka penipuan dan lemahnya sistem deteksi dini, yang pada akhirnya berujung pada kerugian materiil bagi masyarakat, penurunan kepercayaan publik terhadap ekosistem ekonomi digital, serta meningkatnya tantangan bagi regulator dan pelaku industri dalam menjaga integritas transaksi aset digital. 3. Fitur Utama Fradium
A. Fraud Detection by Address
Deskripsi:
Fraud Detection by Address adalah sistem yang memungkinkan pengguna untuk memeriksa reputasi alamat wallet blockchain (seperti Ethereum, BNB Chain, dan lainnya) sebelum melakukan transaksi. Fitur ini dirancang untuk mendeteksi potensi risiko dan mencegah pengguna berinteraksi dengan alamat wallet yang memiliki riwayat aktivitas mencurigakan atau terkait penipuan.
Cara Kerja:
Pengguna memasukkan alamat wallet tujuan yang ingin dicek.
Sistem secara otomatis membandingkan alamat tersebut dengan database blacklist yang terintegrasi, seperti Chainabuse.
Selanjutnya, sistem melakukan analisis perilaku berbasis machine learning untuk mendeteksi pola transaksi abnormal, seperti transfer ke banyak wallet baru atau arus dana yang mengalir dari address scam.
Hasil analisis disajikan dalam bentuk skor risiko (Hijau/Kuning/Merah) beserta notifikasi rekomendasi langkah yang dapat diambil oleh pengguna.
Manfaat:
Mencegah pengguna melakukan transfer dana ke alamat wallet penipu.
Mengurangi jumlah korban penipuan aset digital secara signifikan.
B. Smart Contract Audit with Mythril
Deskripsi:
Fitur ini memberikan layanan audit otomatis terhadap smart contract berbasis Solidity, yang umum digunakan pada berbagai blockchain publik.
Cara Kerja:
Pengguna dapat mengunggah atau menyalin kode smart contract, atau memasukkan alamat kontrak yang ingin diaudit.
Sistem akan menjalankan proses analisa statis menggunakan Mythril, sebuah tool open-source untuk mendeteksi kerentanan keamanan seperti reentrancy, integer overflow/underflow, backdoor, dan bug logika lainnya.
Laporan hasil audit disajikan dalam dua format:
Laporan teknis lengkap untuk developer
Penjelasan yang mudah dipahami bagi pengguna awam
Sistem juga memberikan rekomendasi perbaikan dan edukasi keamanan terkait temuan yang didapatkan.
Manfaat:
Membantu developer dan pengguna mengidentifikasi serta menghindari smart contract yang berbahaya sebelum berinteraksi atau berinvestasi.
Meningkatkan standar keamanan dalam pengembangan dan penggunaan smart contract di ekosistem blockchain.
C. Fradium Wallet
Deskripsi:
Fradium Wallet adalah dompet aset digital (multi-chain) yang dilengkapi dengan sistem proteksi fraud secara otomatis.
Cara Kerja:
Setiap kali pengguna akan melakukan transaksi keluar, sistem secara otomatis melakukan pengecekan alamat tujuan menggunakan modul Fraud Detection by Address.
Jika alamat tujuan terindikasi sebagai scam atau memiliki risiko tinggi, pengguna akan mendapatkan notifikasi peringatan secara instan.
Terdapat mekanisme proteksi berlapis, di mana pengguna tidak dapat melanjutkan transaksi ke alamat dengan risiko sangat tinggi, kecuali jika dilakukan dengan persetujuan eksplisit.
Manfaat:
Mengurangi risiko human error dan penipuan dalam transaksi aset digital.
Memberikan rasa aman dan kenyamanan bagi pengguna sebelum melakukan transaksi.
D. Community Voting & Reporting
Deskripsi:
Community Voting & Reporting adalah fitur crowdsourcing yang memungkinkan pelaporan, voting, dan validasi bersama atas alamat wallet atau smart contract yang dicurigai sebagai fraud.
Cara Kerja:
Pengguna dapat melakukan submit report terhadap alamat atau kontrak yang dicurigai bermasalah, disertai penjelasan dan bukti pendukung jika ada.
Laporan yang masuk dapat divalidasi dan divoting oleh komunitas pengguna lain, sehingga sistem mengakumulasi reputasi pelapor dan tingkat validitas laporan.
Alamat atau kontrak yang telah tervalidasi sebagai fraud secara otomatis masuk ke dalam blacklist global platform dan digunakan untuk deteksi berikutnya.
Manfaat:
Mempercepat proses update dan distribusi database blacklist secara kolektif.
Meningkatkan partisipasi publik dalam pengawasan, serta membangun ekosistem keamanan blockchain yang kolaboratif dan transparan. 4. Target Pengguna
Produk Fradium dirancang untuk digunakan oleh berbagai lapisan pengguna di ekosistem aset digital dan blockchain, dengan cakupan utama sebagai berikut:
Pengguna individu/umum:
Masyarakat umum, investor retail, dan pengguna aset digital (crypto, NFT, dsb) yang membutuhkan perlindungan saat bertransaksi dan ingin memastikan keamanan sebelum berinteraksi dengan wallet atau smart contract.
Developer dan project owner:
Pengembang smart contract, DApps, atau pemilik proyek blockchain yang membutuhkan tools audit otomatis serta database blacklist untuk memastikan ekosistem mereka aman dari celah keamanan dan risiko fraud.
Komunitas blockchain:
Anggota komunitas, edukator, dan pegiat literasi digital yang aktif dalam pelaporan, voting, dan validasi data fraud melalui mekanisme crowdsourcing.
Regulator dan industri keuangan:
Lembaga pengawas, regulator (BI, OJK), serta institusi keuangan yang ingin melakukan monitoring, analisis tren fraud, dan meningkatkan integritas transaksi aset digital di Indonesia. 5. Tujuan Produk
Produk Fradium dikembangkan untuk mencapai tujuan utama sebagai berikut:
Meningkatkan keamanan transaksi aset digital dengan menghadirkan sistem deteksi fraud, audit smart contract, dan proteksi wallet yang mudah diakses oleh seluruh lapisan pengguna.
Memberikan perlindungan nyata bagi konsumen terhadap risiko penipuan, pencurian aset, dan aktivitas ilegal di ekosistem blockchain melalui deteksi dini dan peringatan instan.
Mendorong kolaborasi dan partisipasi komunitas dalam pengawasan serta pelaporan fraud, sehingga database blacklist dapat diperbarui secara cepat dan responsif.
Membangun kepercayaan dan transparansi dalam ekosistem ekonomi digital, sehingga masyarakat semakin yakin untuk bertransaksi dan berinovasi di bidang aset digital.
Mendukung regulator dan pelaku industri dalam memantau, menganalisis, dan mengambil tindakan pencegahan atas tren dan pola penipuan yang berkembang, guna menjaga integritas sistem keuangan digital nasional.
