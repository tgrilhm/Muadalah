/**
 * Template pesan siap pakai untuk komunikasi guru-ortu
 * Setiap template memiliki subject, content, dan type default
 */

export interface MessageTemplate {
  id: string;
  label: string;
  icon: string;
  subject: string;
  content: string;
  type: 'UMUM' | 'AKADEMIK' | 'KEHADIRAN' | 'PEMBAYARAN' | 'DARURAT';
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'absensi_sakit',
    label: 'Pemberitahuan Sakit',
    icon: 'sick',
    subject: 'Pemberitahuan Ketidakhadiran - Sakit',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nDengan hormat, kami sampaikan bahwa putra/putri Bapak/Ibu hari ini tidak dapat mengikuti kegiatan belajar mengajar karena sakit.\n\nMohon untuk menyertakan surat keterangan dari dokter atau klinik agar ketidakhadiran dapat tercatat sebagai izin resmi.\n\nTerima kasih atas perhatian dan kerja samanya.\n\nHormat kami,\nPihak Sekolah',
    type: 'KEHADIRAN',
  },
  {
    id: 'reminder_spp',
    label: 'Reminder SPP',
    icon: 'payments',
    subject: 'Pengingat Pembayaran SPP',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nDengan hormat, kami mengingatkan bahwa pembayaran SPP untuk bulan ini belum kami terima.\n\nMohon untuk segera melakukan pembayaran paling lambat akhir bulan ini guna menghindari keterlambatan yang dapat mempengaruhi proses administrasi.\n\nUntuk informasi lebih lanjut, silakan menghubungi tata usaha sekolah.\n\nTerima kasih atas perhatian dan kerja samanya.\n\nHormat kami,\nAdministrasi Sekolah',
    type: 'PEMBAYARAN',
  },
  {
    id: 'prestasi',
    label: 'Pemberitahuan Prestasi',
    icon: 'military_tech',
    subject: 'Selamat! Pencapaian Prestasi Siswa',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nDengan penuh kebanggaan, kami sampaikan bahwa putra/putri Bapak/Ibu telah menunjukkan prestasi yang luar biasa.\n\nAtas nama seluruh keluarga besar sekolah, kami mengucapkan selamat dan terus mendukung perkembangan akademik maupun non-akademik putra/putri Bapak/Ibu.\n\nMarilah kita bersama-sama terus memotivasi dan mendampingi mereka meraih cita-cita.\n\nHormat kami,\nPihak Sekolah',
    type: 'AKADEMIK',
  },
  {
    id: 'panggilan_ortu',
    label: 'Panggilan Orang Tua',
    icon: 'campaign',
    subject: 'Undangan Pertemuan Orang Tua/Wali Murid',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nDengan hormat, kami mengundang Bapak/Ibu untuk hadir di sekolah guna membicarakan perkembangan belajar putra/putri Bapak/Ibu.\n\nHarap segera menghubungi wali kelas untuk konfirmasi dan penjadwalan pertemuan.\n\nKehadiran Bapak/Ibu sangat kami harapkan demi kepentingan bersama.\n\nTerima kasih.\n\nHormat kami,\nWali Kelas',
    type: 'UMUM',
  },
  {
    id: 'darurat',
    label: 'Pesan Darurat',
    icon: 'emergency',
    subject: '🚨 Pemberitahuan Penting - Perlu Tindakan Segera',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nKami perlu menginformasikan situasi yang memerlukan perhatian segera Bapak/Ibu terkait putra/putri di sekolah.\n\nMohon segera menghubungi pihak sekolah atau hadir di sekolah sesegera mungkin.\n\nTerima kasih.\n\nPihak Sekolah',
    type: 'DARURAT',
  },
  {
    id: 'pengumuman_ujian',
    label: 'Pengumuman Ujian',
    icon: 'edit_note',
    subject: 'Jadwal Ujian/Ulangan Mendatang',
    content:
      'Yth. Bapak/Ibu Orang Tua/Wali Murid,\n\nKami informasikan bahwa dalam waktu dekat akan diadakan ujian/ulangan. Mohon Bapak/Ibu mendampingi dan mendorong putra/putri untuk belajar dengan sungguh-sungguh.\n\nJika ada pertanyaan mengenai materi atau jadwal ujian, silakan menghubungi guru mata pelajaran terkait.\n\nTerima kasih atas dukungan Bapak/Ibu.\n\nHormat kami,\nPihak Sekolah',
    type: 'AKADEMIK',
  },
];

/**
 * Dapatkan template berdasarkan ID
 */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}
