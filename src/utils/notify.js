// ============================================
// MERKEZİ BİLDİRİM & DOĞRULAMA YARDIMCILARI
// alert() yerine sonner toast kullanır
// ============================================
import { toast } from 'sonner';

export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg),
  loading: (msg) => toast.loading(msg, { id: 'tx-loading' }),
  dismiss: () => toast.dismiss('tx-loading'),
};

// Miktar doğrulama
export const validateAmount = (amount, label = 'Miktar') => {
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    notify.error(`${label} geçersiz. Lütfen pozitif bir sayı girin.`);
    return false;
  }
  return true;
};

// Adres doğrulama (basit hex kontrolü)
export const validateAddress = (address) => {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    notify.error('Geçersiz cüzdan adresi.');
    return false;
  }
  return true;
};

// İşlem hatası mesajını temizle
export const extractErrorMessage = (err) => {
  if (!err) return 'Bilinmeyen hata.';
  // Kullanıcı reddi
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') return 'İşlem kullanıcı tarafından iptal edildi.';
  // Ethers v6 shortMessage
  if (err.shortMessage) return err.shortMessage;
  // Revert reason
  if (err.reason) return err.reason;
  // Genel mesaj - kısa tut
  const raw = err.message || String(err);
  return raw.length > 120 ? raw.slice(0, 120) + '…' : raw;
};
