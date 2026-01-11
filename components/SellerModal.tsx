
import React, { useState, useEffect } from 'react';
import { Seller } from '../types';

interface SellerModalProps {
  seller: Seller | null;
  onClose: () => void;
  onSave: (data: Partial<Seller>) => void;
}

const SellerModal: React.FC<SellerModalProps> = ({ seller, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Seller>>({
    name: '',
    password: '',
    role: 'seller'
  });

  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name,
        password: seller.password,
        role: seller.role
      });
    }
  }, [seller]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-200/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-zinc-200 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">
              {seller ? 'Editar Miembro' : 'Nuevo Representante'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-xl transition-all">✕</button>
          </div>
          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
            {seller ? 'Modificar credenciales o rol' : 'Añadir nuevo vendedor al ecosistema'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nombre Completo</label>
            <input 
              type="text" 
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all"
              placeholder="Ej. Juan Pérez"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Contraseña de Acceso</label>
            <input 
              type="password" 
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Rol del Usuario</label>
            <select 
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all appearance-none cursor-pointer"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'seller' })}
            >
              <option value="seller">Representante de Ventas (Seller)</option>
              <option value="admin">Administrador (Control Total)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-hungers text-zinc-950 font-black py-4 rounded-2xl hover:shadow-xl shadow-hungers/30 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
            >
              {seller ? 'Actualizar' : 'Crear Miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerModal;
