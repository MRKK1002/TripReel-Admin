import { X } from 'lucide-react'

function Modal({ isOpen, onClose, title, children, size }) {
  if (!isOpen) return null

  const widthClass = size === 'full' ? 'max-w-5xl' : 'max-w-4xl'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${widthClass} max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal