import React from 'react';
import { Deal } from '../types';

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick, onDragStart }) => {
  const isHot = deal.qualification?.aiCategory === 'Hot';
  
  const getCurrencySymbol = (curr: string) => {
    switch(curr) {
      case 'USD': return '$';
      case 'COP': return '$';
      case 'MXN': return '$';
      default: return '$';
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onClick(deal)}
      className="group bg-white border border-zinc-200 rounded-lg p-3 hover:border-hungers hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none mb-1 shadow-sm"
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-[12px] font-bold text-zinc-900 leading-tight group-hover:text-zinc-600 transition-colors truncate">
          {deal.title || 'Nuevo Negocio'}
        </h4>
        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${isHot ? 'bg-hungers shadow-[0_0_5px_#c1ff72]' : 'bg-zinc-300'}`}></div>
      </div>
      
      <p className="text-[10px] text-zinc-400 mt-0.5 font-medium truncate uppercase tracking-tighter">{deal.organization}</p>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black text-zinc-400">{deal.currency}</span>
          <span className="text-[11px] font-black text-zinc-800">{getCurrencySymbol(deal.currency)}{deal.value.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {isHot && <span className="text-[10px] opacity-80">🔥</span>}
          <div className="w-5 h-5 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-[8px] text-zinc-400 font-black uppercase">
            {deal.contactName?.charAt(0) || '?'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCard;