const Modal = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-[90%] max-w-md rounded-lg bg-white p-4 shadow-xl text-slate-900">
                {children}
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};


export default Modal;
