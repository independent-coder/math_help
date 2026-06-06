import { X, Newspaper, ChevronRight, Info, Wrench, Sparkles } from 'lucide-react'
import { DEV_NEWS } from '../utils/devNews'

function DevNewsModal({ onClose }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'update': return <Wrench size={16} className="text-blue-400" />;
      case 'feature': return <Sparkles size={16} className="text-purple-400" />;
      case 'fix': return <Info size={16} className="text-emerald-400" />;
      default: return <Newspaper size={16} className="text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-dark border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Newspaper size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Developer News</h2>
              <p className="text-xs text-gray-500">Changelog & Updates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {DEV_NEWS.map((item) => (
            <div key={item.id} className="relative pl-6 border-l-2 border-primary/20 hover:border-primary/50 transition-colors py-1 group">
              <div className="absolute -left-[9px] top-2 w-4 h-4 bg-dark border-2 border-primary rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-primary/20" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {getTypeIcon(item.type)}
                    {item.type}
                  </span>
                  <span className="text-[10px] font-medium text-gray-600">{item.date}</span>
                </div>
                <h3 className="font-bold text-white group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 text-center">
            <p className="text-[10px] text-gray-500">Stay tuned for more updates!</p>
        </div>
      </div>
    </div>
  )
}

export default DevNewsModal
