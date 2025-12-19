
import React from 'react';
import { Deal } from '../types';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick, onDragStart }) => {
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onClick(deal)}
      className="bg-zinc-900 border border-dark-border p-4 rounded-xl hover:border-hungers/50 cursor-grab active:cursor-grabbing transition-all duration-200 group shadow-sm hover:shadow-hungers/5 select-none"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-hungers line-clamp-2">{deal.title}</h4>
      </div>
      <p className="text-xs text-zinc-500 mb-3">{deal.organization}</p>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm font-bold text-white">
          ${deal.value.toLocaleString('es-ES')}
        </span>
        <div className="flex -space-x-2">
          <div className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityColor(deal.priority)} uppercase font-bold`}>
            {deal.priority}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
          {deal.contactName.charAt(0)}
        </div>
        <span className="text-[11px] text-zinc-400">{deal.contactName}</span>
      </div>
    </div>
  );
};

export default DealCard;
