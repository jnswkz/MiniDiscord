"use client";

interface BlockConfirmModalProps {
  username: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function BlockConfirmModal({
  username,
  onClose,
  onConfirm,
}: BlockConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[440px] rounded-md bg-[#313338] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Body */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-white">
            Chặn {username}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#dbdee1]">
            Bạn có chắc chắn muốn chặn{" "}
            <strong className="font-semibold text-white">{username}</strong>{" "}
            không? Hành động này sẽ xóa họ khỏi danh sách bạn bè của bạn và
            họ sẽ không thể nhắn tin cho bạn nữa.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 rounded-b-md bg-[#2b2d31] px-4 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#dbdee1] hover:text-white hover:underline bg-transparent transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md bg-[#da373c] px-6 py-2 text-sm font-medium text-white hover:bg-[#a12828] transition-colors cursor-pointer"
          >
            Chặn
          </button>
        </div>
      </div>
    </div>
  );
}
