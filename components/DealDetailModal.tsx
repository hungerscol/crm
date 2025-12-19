
import React, { useState, useEffect } from 'react';
import { Deal, DealStatus, Activity, Country } from '../types';
import { analyzeDeal } from '../services/geminiService';
import { SELLERS } from '../constants';

interface DealDetailModalProps {
  deal: Deal | null;
  onClose: () => void;
  onUpdateDeal: (updatedDeal: Deal) => void;
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({ deal, onClose, onUpdateDeal }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [activityInput, setActivityInput] = useState({ content: '', type: 'Nota' as Activity['type'], date: new Date().toISOString().split('T')[0] });

  const isCreation = deal && deal.id.startsWith('deal-');

  useEffect(() => {
    if (deal) {
      setAnalysis('');
      setFormData({ ...deal });
    }
  }, [deal]);

  const handleSave = () => {
    if (deal && formData) {
      onUpdateDeal({ ...deal, ...formData } as Deal);
      onClose();
    }
  };

  const scheduleActivity = () => {
    if (!activityInput.content || !deal) return;
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: activityInput.type,
      content: activityInput.content,
      date: activityInput.date,
      completed: false
    };
    const updatedActivities = [...(formData.activities || []), newActivity];
    setFormData({ ...formData, activities: updatedActivities, nextSteps: activityInput.content });
    setActivityInput({ content: '', type: 'Nota', date: new Date().toISOString().split('T')[0] });
  };

  if (!deal || !formData) return null;

  const valueCOP = (formData.value || 0) * 4200; // Mock rate
  const valueMXN = (formData.value || 0) * 20.5; // Mock rate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden">
      <div className="bg-dark-lighter w-full max-w-5xl rounded-2xl border border-dark-border shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-dark-border flex justify-between items-center bg-zinc-900/80">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <select 
                className="bg-hungers text-dark text-[10px] font-black uppercase px-2 py-0.5 rounded cursor-pointer outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as DealStatus})}
              >
                {Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-zinc-500 text-xs">{isCreation ? 'Nuevo Lead' : `Expediente #${deal.id}`}</span>
            </div>
            <input 
              className="w-full bg-transparent text-2xl font-bold text-white border-none focus:ring-1 focus:ring-hungers/30 rounded px-1 outline-none"
              value={formData.title || ''}
              placeholder="Nombre del Negocio"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info (Lead Data) */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <h3 className="text-xs font-black text-hungers uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Empresa</label>
                  <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-hungers/50 outline-none transition-all"
                    value={formData.organization || ''} onChange={(e) => setFormData({...formData, organization: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Nombre del Contacto</label>
                  <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-hungers/50 outline-none transition-all"
                    value={formData.contactName || ''} onChange={(e) => setFormData({...formData, contactName: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Email Corporativo</label>
                  <input type="email" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-hungers/50 outline-none transition-all"
                    value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Teléfono / WhatsApp</label>
                  <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-hungers/50 outline-none transition-all"
                    value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Dirección del Cliente</label>
                  <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-hungers/50 outline-none transition-all"
                    value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            </section>

            <section>
               <h3 className="text-xs font-black text-hungers uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Asignación y Localización
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Vendedor Asignado</label>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-hungers/50 transition-all"
                    value={formData.sellerId}
                    onChange={(e) => setFormData({...formData, sellerId: e.target.value})}
                  >
                    <option value="">Seleccionar Vendedor</option>
                    {SELLERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">País / Región</label>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-hungers/50 transition-all"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value as Country})}
                  >
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-hungers uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Valor de la Negociación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 shadow-inner">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Monto Base (USD)</label>
                  <input type="number" className="w-full bg-transparent border-b border-zinc-700 text-2xl text-white font-black outline-none focus:border-hungers"
                    value={formData.value || 0} onChange={(e) => setFormData({...formData, value: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Equivalente COP</label>
                  <p className="text-xl font-bold text-zinc-300">$ {valueCOP.toLocaleString('es-CO')}</p>
                </div>
                <div className="flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Equivalente MXN</label>
                  <p className="text-xl font-bold text-zinc-300">$ {valueMXN.toLocaleString('es-MX')}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-hungers uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Programar Actividades / Siguientes Pasos
              </h3>
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Actividad</label>
                    <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-hungers/50"
                      placeholder="Ej: Llamar para cierre..."
                      value={activityInput.content} onChange={(e) => setActivityInput({...activityInput, content: e.target.value})} />
                  </div>
                  <div className="w-32">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Tipo</label>
                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none"
                      value={activityInput.type} onChange={(e) => setActivityInput({...activityInput, type: e.target.value as any})}>
                      <option>Nota</option>
                      <option>Llamada</option>
                      <option>Correo</option>
                      <option>Reunión</option>
                    </select>
                  </div>
                  <div className="w-40">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Fecha</label>
                    <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white text-sm outline-none"
                      value={activityInput.date} onChange={(e) => setActivityInput({...activityInput, date: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={scheduleActivity} className="bg-hungers text-dark px-4 py-2 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all">Añadir</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.activities?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => (
                    <div key={act.id} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          act.type === 'Reunión' ? 'border-blue-500 text-blue-500' :
                          act.type === 'Llamada' ? 'border-yellow-500 text-yellow-500' :
                          'border-zinc-500 text-zinc-500'
                        }`}>{act.type}</span>
                        <p className="text-sm text-zinc-300">{act.content}</p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">{act.date}</span>
                    </div>
                  ))}
                  {(!formData.activities || formData.activities.length === 0) && <p className="text-center text-xs text-zinc-600 italic py-4">No hay actividades programadas</p>}
                </div>
              </div>
            </section>
          </div>

          {/* AI Insights & Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-hungers/5 border border-hungers/20 p-6 rounded-2xl shadow-xl shadow-hungers/5">
              <h3 className="text-xs font-black text-hungers uppercase flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Hungers AI Insights
              </h3>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed italic">Nuestra IA analiza los datos del cliente para sugerirte la mejor estrategia de cierre.</p>
              <button 
                onClick={async () => {
                  setLoading(true);
                  const res = await analyzeDeal(formData as Deal);
                  setAnalysis(res);
                  setLoading(false);
                }}
                className="w-full bg-hungers text-dark text-xs font-black py-3 rounded-xl mb-4 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-hungers/20"
                disabled={loading}
              >
                {loading ? 'Generando Estrategia...' : 'Generar Análisis IA'}
              </button>
              {analysis && <div className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 max-h-60 overflow-y-auto custom-scrollbar prose prose-invert">{analysis}</div>}
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Estado del Lead</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500">Prioridad:</span>
                   <select 
                    className="bg-zinc-800 text-white rounded px-2 py-0.5 outline-none"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                   >
                     <option value="low">Baja</option>
                     <option value="medium">Media</option>
                     <option value="high">Alta</option>
                   </select>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-zinc-500">Creado el:</span>
                   <span className="text-zinc-300">{new Date(formData.createdAt || Date.now()).toLocaleDateString()}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-dark-border bg-zinc-900/50 flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-hungers text-dark font-black py-3.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-hungers/20">
            {isCreation ? 'Crear Nuevo Registro' : 'Confirmar Cambios'}
          </button>
          <button onClick={onClose} className="px-8 border border-zinc-700 text-zinc-400 font-bold py-3.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-all">Descartar</button>
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;
