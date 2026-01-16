
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
        password: seller.password || '',
        role: seller.role
      });
    } else {
      setFormData({
        name: '',
        password: '',
        role: 'seller'
      });
    }
  }, [seller]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.password?.trim()) {
      alert('Por favor completa todos los campos para el acceso de HUNGERS.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-hungers-dark/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] border border-zinc-200 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-hungers-dark uppercase tracking-tighter">
              {seller ? 'Editar Miembro' : 'Nuevo Representante'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-xl transition-all text-hungers-medium">✕</button>
          </div>
          <p className="text-[10px] text-hungers-medium font-black uppercase tracking-widest">
            {seller ? 'Modificar credenciales o rol' : 'Añadir nuevo vendedor al ecosistema'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-hungers-medium uppercase tracking-widest ml-2">Nombre Completo / Usuario</label>
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all text-hungers-dark placeholder:text-zinc-200"
              placeholder="Ej. Andrés Mendoza"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-hungers-medium uppercase tracking-widest ml-2">Contraseña de Acceso</label>
            <input 
              type="text" 
              required
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all text-hungers-dark placeholder:text-zinc-200"
              placeholder="Min. 6 caracteres"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <p className="text-[8px] text-hungers-medium uppercase font-bold mt-1 ml-2 opacity-60">* Este campo será necesario para iniciar sesión.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-hungers-medium uppercase tracking-widest ml-2">Rol del Usuario</label>
            <div className="relative">
              <select 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-hungers focus:ring-4 focus:ring-hungers/10 outline-none transition-all appearance-none cursor-pointer text-hungers-dark"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'seller' })}
              >
                <option value="seller">Representante de Ventas (Seller)</option>
                <option value="admin">Administrador (Control Total)</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-hungers-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-hungers-medium hover:text-hungers-dark transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-hungers text-hungers-dark font-black py-4 rounded-2xl hover:shadow-xl shadow-hungers/30 active:scale-95 transition-all uppercase text-[10px] tracking-widest"
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
