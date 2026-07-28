
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Deal, DealStatus, Currency, Country } from '../types';

interface ImportCSVModalProps {
  existingDeals: Deal[];
  currentUserId: string;
  onClose: () => void;
  onImport: (newDeals: Deal[], updatedDeals: Deal[]) => void;
}

type DealField = keyof Pick<Deal,
  'title' | 'organization' | 'contactName' | 'contactTitle' | 'email' | 'phone' |
  'address' | 'status' | 'priority' | 'value' | 'currency' | 'country' | 'nextSteps'
>;

interface FieldDef {
  field: DealField;
  label: string;
  required?: boolean;
  aliases: string[];
}

const FIELD_DEFS: FieldDef[] = [
  { field: 'organization', label: 'Empresa', required: true, aliases: ['company_name', 'empresa', 'organization', 'organizacion', 'company'] },
  { field: 'title', label: 'Nombre del Negocio', aliases: ['title', 'deal_name', 'nombre_negocio', 'negocio'] },
  { field: 'contactName', label: 'Contacto', aliases: ['contact_name', 'contacto', 'nombre_contacto', 'name'] },
  { field: 'contactTitle', label: 'Cargo del Contacto', aliases: ['contact_title', 'cargo', 'puesto', 'position'] },
  { field: 'email', label: 'Email', aliases: ['email', 'correo', 'e-mail'] },
  { field: 'phone', label: 'Teléfono', aliases: ['phone', 'telefono', 'teléfono', 'celular'] },
  { field: 'address', label: 'Dirección', aliases: ['address', 'direccion', 'dirección'] },
  { field: 'status', label: 'Estado', aliases: ['status', 'estado'] },
  { field: 'priority', label: 'Prioridad', aliases: ['priority', 'prioridad'] },
  { field: 'value', label: 'Valor', aliases: ['value', 'valor', 'monto'] },
  { field: 'currency', label: 'Moneda', aliases: ['currency', 'moneda'] },
  { field: 'country', label: 'País', aliases: ['country', 'pais', 'país'] },
  { field: 'nextSteps', label: 'Próximos Pasos', aliases: ['next_steps', 'nextsteps', 'proximos_pasos', 'siguientes_pasos'] },
];

const STATUS_ALIASES: Record<string, DealStatus> = {
  'lead in': DealStatus.LEAD_IN, 'lead_in': DealStatus.LEAD_IN, 'nuevo': DealStatus.LEAD_IN,
  'contactado': DealStatus.CONTACTED, 'contacted': DealStatus.CONTACTED,
  'reunion agendada': DealStatus.MEETING_SCHEDULED, 'reunión agendada': DealStatus.MEETING_SCHEDULED, 'meeting_scheduled': DealStatus.MEETING_SCHEDULED,
  'propuesta enviada': DealStatus.PROPOSAL_SENT, 'proposal_sent': DealStatus.PROPOSAL_SENT,
  'negociacion': DealStatus.NEGOTIATING, 'negociación': DealStatus.NEGOTIATING, 'negotiating': DealStatus.NEGOTIATING,
  'cerrado': DealStatus.CLOSED, 'closed': DealStatus.CLOSED,
  'ganado': DealStatus.WON, 'won': DealStatus.WON,
  'perdido': DealStatus.LOST, 'lost': DealStatus.LOST,
};

const CURRENCY_VALUES: Currency[] = ['COP', 'USD', 'MXN'];
const COUNTRY_VALUES: Country[] = ['Colombia', 'México', 'Otros'];

const normalize = (s: string) => s.trim().toLowerCase();

const guessMapping = (headers: string[]): Record<DealField, string | null> => {
  const mapping = {} as Record<DealField, string | null>;
  FIELD_DEFS.forEach(def => {
    const match = headers.find(h => def.aliases.includes(normalize(h)));
    mapping[def.field] = match || null;
  });
  return mapping;
};

const parseStatus = (raw: string | undefined): DealStatus => {
  if (!raw) return DealStatus.LEAD_IN;
  return STATUS_ALIASES[normalize(raw)] || DealStatus.LEAD_IN;
};

const parsePriority = (raw: string | undefined): 'low' | 'medium' | 'high' => {
  const v = normalize(raw || '');
  if (v === 'high' || v === 'alta') return 'high';
  if (v === 'low' || v === 'baja') return 'low';
  return 'medium';
};

const parseCurrency = (raw: string | undefined): Currency => {
  const v = (raw || '').trim().toUpperCase();
  return (CURRENCY_VALUES as string[]).includes(v) ? (v as Currency) : 'COP';
};

const parseCountry = (raw: string | undefined): Country => {
  const v = (raw || '').trim();
  const match = COUNTRY_VALUES.find(c => normalize(c) === normalize(v));
  return match || 'Otros';
};

const rowToDeal = (row: Record<string, string>, mapping: Record<DealField, string | null>, sellerId: string): Deal => {
  const get = (field: DealField) => {
    const col = mapping[field];
    return col ? (row[col] || '').trim() : '';
  };

  const organization = get('organization');
  return {
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: get('title') || organization,
    value: Number(get('value').replace(/[^0-9.-]/g, '')) || 0,
    currency: parseCurrency(get('currency')),
    contactName: get('contactName'),
    contactTitle: get('contactTitle') || undefined,
    organization,
    phone: get('phone'),
    email: get('email'),
    address: get('address'),
    status: parseStatus(get('status')),
    priority: parsePriority(get('priority')),
    activities: [],
    nextSteps: get('nextSteps'),
    createdAt: new Date().toISOString(),
    country: parseCountry(get('country')),
    sellerId,
  };
};

type Step = 'upload' | 'mapping' | 'duplicates' | 'summary';

interface DuplicateEntry {
  incoming: Deal;
  existing: Deal;
  action: 'update' | 'skip';
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ existingDeals, currentUserId, onClose, onImport }) => {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<DealField, string | null>>({} as any);
  const [parseError, setParseError] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [freshDeals, setFreshDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState({ imported: 0, updated: 0, skipped: 0 });

  const handleFile = (file: File) => {
    setParseError('');
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data.length) {
          setParseError('El archivo no contiene filas de datos.');
          return;
        }
        const detectedHeaders = result.meta.fields || [];
        setHeaders(detectedHeaders);
        setRows(result.data);
        setMapping(guessMapping(detectedHeaders));
        setFileName(file.name);
        setStep('mapping');
      },
      error: (err) => {
        setParseError(`Error al leer el CSV: ${err.message}`);
      }
    });
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const previewDeals = rows.slice(0, 5).map(r => rowToDeal(r, mapping, currentUserId));

  const goToDuplicatesOrSummary = () => {
    if (!mapping.organization) {
      setParseError('Debes mapear al menos la columna "Empresa" para continuar.');
      return;
    }

    const allIncoming = rows.map(r => rowToDeal(r, mapping, currentUserId));
    const foundDuplicates: DuplicateEntry[] = [];
    const nonDuplicates: Deal[] = [];

    allIncoming.forEach(incoming => {
      const existing = existingDeals.find(d => normalize(d.organization) === normalize(incoming.organization) && incoming.organization !== '');
      if (existing) {
        foundDuplicates.push({ incoming, existing, action: 'skip' });
      } else {
        nonDuplicates.push(incoming);
      }
    });

    setFreshDeals(nonDuplicates);

    if (foundDuplicates.length > 0) {
      setDuplicates(foundDuplicates);
      setStep('duplicates');
    } else {
      confirmImport(nonDuplicates, []);
    }
  };

  const confirmImport = (fresh: Deal[], dupes: DuplicateEntry[]) => {
    const toUpdate = dupes.filter(d => d.action === 'update');
    const toSkip = dupes.filter(d => d.action === 'skip');

    const updatedDeals: Deal[] = toUpdate.map(d => ({
      ...d.incoming,
      id: d.existing.id,
      contactId: d.existing.contactId,
      createdAt: d.existing.createdAt,
    }));

    onImport(fresh, updatedDeals);

    setSummary({ imported: fresh.length, updated: updatedDeals.length, skipped: toSkip.length });
    setStep('summary');
  };

  const setDuplicateAction = (index: number, action: 'update' | 'skip') => {
    setDuplicates(prev => prev.map((d, i) => i === index ? { ...d, action } : d));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-hungers-dark/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] border border-zinc-200 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-hungers-dark uppercase tracking-tighter">Importar CSV</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-xl transition-all text-hungers-medium">✕</button>
          </div>
          <p className="text-[10px] text-hungers-medium font-black uppercase tracking-widest">
            {step === 'upload' && 'Selecciona un archivo .csv con tus leads'}
            {step === 'mapping' && `Mapea columnas · ${fileName} · ${rows.length} filas`}
            {step === 'duplicates' && `Se encontraron ${duplicates.length} coincidencias por empresa`}
            {step === 'summary' && 'Importación completada'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-6">
              <div className="w-20 h-20 bg-hungers/20 rounded-3xl flex items-center justify-center text-3xl">📄</div>
              <label className="cursor-pointer bg-hungers text-hungers-dark px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-hungers/20 hover:scale-105 active:scale-95 transition-all">
                Seleccionar Archivo CSV
                <input type="file" accept=".csv" className="hidden" onChange={onFileInputChange} />
              </label>
              {parseError && <p className="text-red-600 text-[10px] font-black text-center bg-red-50 py-3 px-6 rounded-xl border border-red-100">{parseError}</p>}
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {FIELD_DEFS.map(def => (
                  <div key={def.field} className="space-y-1">
                    <label className="text-[9px] font-black text-hungers-medium uppercase tracking-widest ml-1">
                      {def.label}{def.required && <span className="text-red-500"> *</span>}
                    </label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-hungers focus:ring-2 focus:ring-hungers/20 outline-none transition-all text-hungers-dark"
                      value={mapping[def.field] || ''}
                      onChange={e => setMapping(prev => ({ ...prev, [def.field]: e.target.value || null }))}
                    >
                      <option value="">— No mapear —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {parseError && <p className="text-red-600 text-[10px] font-black text-center bg-red-50 py-3 rounded-xl border border-red-100">{parseError}</p>}

              <div>
                <h4 className="text-[10px] font-black text-hungers-dark uppercase tracking-widest mb-3">Preview (primeras {previewDeals.length} filas)</h4>
                <div className="border border-zinc-200 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-zinc-50 font-black uppercase text-hungers-medium tracking-widest">
                      <tr>
                        <th className="p-3">Empresa</th>
                        <th className="p-3">Negocio</th>
                        <th className="p-3">Contacto</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {previewDeals.map((d, i) => (
                        <tr key={i}>
                          <td className="p-3 font-bold text-hungers-dark">{d.organization || '—'}</td>
                          <td className="p-3">{d.title || '—'}</td>
                          <td className="p-3">{d.contactName || '—'}</td>
                          <td className="p-3">{d.email || '—'}</td>
                          <td className="p-3">{d.status}</td>
                          <td className="p-3">{d.value ? `${d.currency} ${d.value.toLocaleString()}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'duplicates' && (
            <div className="space-y-4">
              <p className="text-[10px] text-hungers-medium font-bold">Para cada empresa ya existente en el pipeline, elige si quieres actualizar el negocio existente o saltar (omitir) la fila del CSV.</p>
              <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                {duplicates.map((d, i) => (
                  <div key={i} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-hungers-dark">{d.existing.organization}</p>
                      <p className="text-[9px] text-hungers-medium font-bold uppercase tracking-widest">Existente: {d.existing.contactName || '—'} · Nuevo: {d.incoming.contactName || '—'}</p>
                    </div>
                    <div className="flex bg-zinc-50 p-1 rounded-xl flex-shrink-0">
                      <button
                        onClick={() => setDuplicateAction(i, 'skip')}
                        className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${d.action === 'skip' ? 'bg-white text-hungers-dark shadow-sm' : 'text-hungers-medium'}`}
                      >SALTAR</button>
                      <button
                        onClick={() => setDuplicateAction(i, 'update')}
                        className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all ${d.action === 'update' ? 'bg-white text-hungers-dark shadow-sm' : 'text-hungers-medium'}`}
                      >ACTUALIZAR</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-6 text-center">
              <div className="w-20 h-20 bg-hungers/20 rounded-3xl flex items-center justify-center text-3xl">✅</div>
              <div className="grid grid-cols-3 gap-6 w-full max-w-md">
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                  <p className="text-2xl font-black text-hungers-dark">{summary.imported}</p>
                  <p className="text-[9px] font-black text-hungers-medium uppercase tracking-widest mt-1">Importados</p>
                </div>
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                  <p className="text-2xl font-black text-hungers-dark">{summary.updated}</p>
                  <p className="text-[9px] font-black text-hungers-medium uppercase tracking-widest mt-1">Actualizados</p>
                </div>
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                  <p className="text-2xl font-black text-hungers-dark">{summary.skipped}</p>
                  <p className="text-[9px] font-black text-hungers-medium uppercase tracking-widest mt-1">Saltados</p>
                </div>
              </div>
              <p className="text-[9px] text-hungers-medium font-bold uppercase tracking-widest opacity-70">Los nuevos negocios ya están listos en el pipeline.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex-shrink-0 flex justify-end gap-4">
          {step === 'mapping' && (
            <>
              <button onClick={() => setStep('upload')} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-hungers-medium hover:text-hungers-dark transition-all">Volver</button>
              <button onClick={goToDuplicatesOrSummary} className="bg-hungers text-hungers-dark px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-hungers/20 hover:scale-105 active:scale-95 transition-all">Continuar</button>
            </>
          )}
          {step === 'duplicates' && (
            <>
              <button onClick={() => setStep('mapping')} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-hungers-medium hover:text-hungers-dark transition-all">Volver</button>
              <button onClick={() => confirmImport(freshDeals, duplicates)} className="bg-hungers text-hungers-dark px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-hungers/20 hover:scale-105 active:scale-95 transition-all">Confirmar Import</button>
            </>
          )}
          {step === 'summary' && (
            <button onClick={onClose} className="bg-hungers text-hungers-dark px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-hungers/20 hover:scale-105 active:scale-95 transition-all">Cerrar</button>
          )}
          {step === 'upload' && (
            <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-hungers-medium hover:text-hungers-dark transition-all">Cancelar</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
