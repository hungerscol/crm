
import React, { useState, useEffect } from 'react';
import { Deal, DealStatus, Activity, Seller, Currency, Contact } from '../types';
import { PIPELINE_STAGES } from '../constants';
import { analyzeDeal } from '../services/geminiService';

interface DealDetailModalProps {
  deal: Deal | null;
  onClose: () => void;
  onUpdateDeal: (updatedDeal: Deal) => void;
  sellers: Seller[];
  contacts: Contact[];
  onDelete?: () => void;
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({ deal, onClose, onUpdateDeal, sellers, contacts, onDelete }) => {
  const [activeSubTab, setActiveSubTab] = useState<'Nota' | 'Llamada' | 'Reunión'>('Nota');
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [noteInput, setNoteInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (deal) {
      setFormData({ ...deal });
      setAiAnalysis(null);
    }
  }, [deal]);

  const handleStatusChange = (status: DealStatus) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSave = () => {
    if (deal && formData) {
      onUpdateDeal({ ...deal, ...formData } as Deal);
      onClose();
    }
  };

  const handleAiAnalysis = async () => {
    if (!deal) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeDeal({ ...deal, ...formData } as Deal);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("Error al obtener insights de la IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addActivity = () => {
    if (!noteInput.trim()) return;
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      type: activeSubTab,
      content: noteInput,
      date: new Date().toISOString(),
      dueDate: dueDate || undefined,
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      activities: [newAct, ...(prev.activities || [])]
    }));
    setNoteInput('');
    setDueDate('');
  };

  const toggleActivityStatus = (id: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities?.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
    }));
  };

  if (!deal || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-hungers-medium/10 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-[2.5rem] border border-zinc-200 flex flex-col overflow-hidden shadow-[0_35px_60px_-15px_rgba(136,212,61,0.1)] animate-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <input 
                className="bg-transparent text-4xl font-black tracking-tighter text-hungers-dark border-none outline-none focus:ring-0 p-0 w-full placeholder:text-zinc-200"
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Nombre del Trato"
              />
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase text-hungers-medium tracking-widest bg-zinc-100 px-2 py-1 rounded-md">ID: {formData.id}</span>
                <span className="text-[10px] font-black uppercase text-hungers-medium tracking-widest">Creado: {new Date(formData.createdAt || '').toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 bg-hungers text-hungers-dark rounded-2xl hover:bg-hungers-medium transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-hungers-dark border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-xl">✨</span>
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">Estrategia AI</span>
              </button>
              {onDelete && (
                <button onClick={onDelete} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
              <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-2xl text-hungers-medium transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          {/* Pipeline Stepper */}
          <div className="flex gap-1.5 h-10">
            {PIPELINE_STAGES.map((s) => (
              <button 
                key={s} 
                onClick={() => handleStatusChange(s as any)} 
                className={`flex-1 pipeline-chevron text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-hungers text-hungers-dark shadow-md' : 'bg-zinc-100 text-hungers-medium hover:bg-zinc-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Metadata & Insights */}
          <div className="w-80 border-r border-zinc-100 p-8 space-y-8 overflow-y-auto bg-zinc-50/20 custom-scrollbar">
            {aiAnalysis && (
              <section className="bg-hungers-soft border border-hungers-medium/20 p-6 rounded-3xl animate-in slide-in-from-left duration-500 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">✨</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-hungers-dark">Insights de Hungers AI</p>
                </div>
                <div className="text-[11px] leading-relaxed font-medium prose max-w-none text-hungers-dark">
                  {aiAnalysis.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <p className="text-[10px] font-black text-hungers-dark uppercase tracking-widest border-b border-zinc-100 pb-2">Información de Contacto</p>
              <div className="space-y-4">
                {[
                  { label: 'Nombre', key: 'contactName', icon: '👤', placeholder: 'Nombre del lead' },
                  { label: 'Email', key: 'email', icon: '✉️', placeholder: 'correo@ejemplo.com' },
                  { label: 'Teléfono', key: 'phone', icon: '📞', placeholder: '+57...' },
                  { label: 'Empresa', key: 'organization', icon: '🏢', placeholder: 'Nombre empresa' }
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] font-black text-hungers-medium uppercase tracking-widest ml-1">{field.label}</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-3.5 text-xs opacity-50">{field.icon}</span>
                      <input 
                        className="w-full bg-white border border-zinc-100 rounded-xl py-3 pl-9 pr-4 text-xs font-bold text-hungers-dark outline-none focus:border-hungers-medium transition-all" 
                        placeholder={field.placeholder} 
                        value={(formData as any)[field.key]} 
                        onChange={e => setFormData({...formData, [field.key]: e.target.value})} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <p className="text-[10px] font-black text-hungers-dark uppercase tracking-widest border-b border-zinc-100 pb-2">Configuración Económica</p>
              <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-hungers-medium uppercase tracking-widest ml-1">Moneda</span>
                  <select className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[10px] font-black text-hungers-dark outline-none focus:border-hungers-medium appearance-none" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                    <option value="COP">COP (Colombia)</option>
                    <option value="USD">USD (Dólares)</option>
                    <option value="MXN">MXN (México)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-hungers-medium uppercase tracking-widest ml-1">Valor del Deal</span>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-hungers-medium font-black text-xs">$</span>
                    <input type="number" className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3 pl-8 text-sm font-black text-hungers-dark outline-none focus:border-hungers-medium" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT PANEL: Activities Timeline */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-8 border-b border-zinc-50 bg-white">
              <div className="flex gap-8 mb-6 border-b border-zinc-50">
                {(['Nota', 'Llamada', 'Reunión'] as const).map(t => (
                  <button 
                    key={t} 
                    onClick={() => setActiveSubTab(t)} 
                    className={`text-[11px] font-black uppercase tracking-widest pb-3 transition-all relative ${activeSubTab === t ? 'text-hungers-dark' : 'text-hungers-medium hover:text-hungers-dark'}`}
                  >
                    {t}s
                    {activeSubTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-hungers-medium rounded-full"></div>}
                  </button>
                ))}
              </div>
              
              <div className="relative p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                <textarea 
                  className="w-full bg-transparent text-sm font-medium text-hungers-dark outline-none resize-none h-24 placeholder:text-zinc-300 custom-scrollbar" 
                  placeholder={`Redacta los detalles de la ${activeSubTab.toLowerCase()}...`} 
                  value={noteInput} 
                  onChange={e => setNoteInput(e.target.value)} 
                />
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100">
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-hungers-medium uppercase tracking-widest ml-1">Prioridad</span>
                       <select className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[9px] font-black outline-none text-hungers-dark" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                         <option value="low">Baja</option>
                         <option value="medium">Media</option>
                         <option value="high">Alta</option>
                       </select>
                     </div>
                     <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-hungers-medium uppercase tracking-widest ml-1">Fecha Límite</span>
                       <input type="date" className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[9px] font-black outline-none text-hungers-dark" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                     </div>
                   </div>
                   <button onClick={addActivity} className="bg-hungers text-hungers-dark px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-hungers-medium hover:text-white transition-all">Agregar {activeSubTab}</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/20 custom-scrollbar">
              <div className="flex items-center gap-3 mb-2">
                 <p className="text-[10px] font-black text-hungers-dark uppercase tracking-[0.2em]">Historial de Actividad</p>
                 <div className="flex-1 h-px bg-zinc-100"></div>
              </div>
              
              {!formData.activities || formData.activities.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-hungers-medium opacity-40">
                   <div className="text-4xl mb-2">📅</div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Sin tareas registradas</p>
                </div>
              ) : (
                formData.activities.map(act => (
                  <div key={act.id} className={`flex gap-5 group relative animate-in slide-in-from-bottom duration-300 ${act.completed ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => toggleActivityStatus(act.id)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm shadow-sm transition-all z-10 ${act.completed ? 'bg-hungers text-hungers-dark border-hungers-medium' : 'bg-white border border-zinc-200 text-hungers-medium hover:bg-hungers hover:text-hungers-dark'}`}
                      >
                        {act.completed ? '✓' : act.type === 'Nota' ? '📄' : act.type === 'Llamada' ? '📞' : '🤝'}
                      </button>
                      <div className="w-px flex-1 bg-zinc-100 my-1"></div>
                    </div>
                    <div className={`flex-1 bg-white p-5 rounded-[1.8rem] border transition-all duration-300 shadow-sm ${act.completed ? 'border-hungers-medium/20 bg-hungers-soft' : 'border-zinc-100 hover:border-zinc-200 hover:shadow-lg'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${act.type === 'Llamada' ? 'text-blue-700' : act.type === 'Reunión' ? 'text-purple-700' : 'text-hungers-dark'}`}>{act.type}</span>
                        <span className="text-[8px] font-bold text-hungers-medium bg-zinc-50 px-2 py-0.5 rounded-full">{new Date(act.date).toLocaleString()}</span>
                      </div>
                      <p className={`text-[12px] leading-relaxed font-medium ${act.completed ? 'text-hungers-medium line-through' : 'text-hungers-dark'}`}>{act.content}</p>
                      {act.dueDate && (
                        <div className="mt-3 pt-3 border-t border-zinc-50 flex items-center gap-2">
                           <span className="text-[8px] font-black text-hungers-medium uppercase tracking-widest">Agenda para:</span>
                           <span className="text-[10px] font-black text-hungers-dark">{new Date(act.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-zinc-100 flex justify-end gap-6 items-center">
          <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-hungers-medium uppercase tracking-widest hover:text-hungers-dark transition-all">Cancelar</button>
          <button onClick={handleSave} className="bg-hungers text-hungers-dark px-12 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] shadow-lg shadow-hungers-medium/10 hover:bg-hungers-medium transition-all">Guardar Deal</button>
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;
