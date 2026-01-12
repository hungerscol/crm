
import { GoogleGenAI, Type } from "@google/genai";
import { Deal, LeadQualification } from "../types";

export const analyzeDeal = async (deal: Deal): Promise<string> => {
  try {
    // Usando el sistema de variables de entorno de Vite para evitar errores de compilación
    const apiKey = (import.meta as any).env.VITE_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres el Director de Estrategia de Ventas Senior en "Hungers". Tu especialidad es el cierre táctico de tratos complejos en el sector logístico y de alimentos.
      
      Analiza este trato y proporciona una guía de CIERRE PROFESIONAL:
      - Título: ${deal.title}
      - Valor: ${deal.currency} ${deal.value}
      - Cliente: ${deal.contactName} de ${deal.organization}
      - Estado actual: ${deal.status}
      - Actividades recientes: ${deal.activities.slice(0, 3).map(a => a.content).join('; ')}
      
      Responde con: Gatillo Psicológico, Estrategia de Valor, Manejo de Objeciones y NEXT STEP IMPERATIVO.`,
    });
    return response.text || "La IA no pudo generar una estrategia en este momento.";
  } catch (error) {
    console.error("Error analyzing deal:", error);
    return "Error al conectar con la inteligencia estratégica de Hungers.";
  }
};

export const qualifyLead = async (deal: Deal): Promise<Partial<LeadQualification>> => {
  try {
    const apiKey = (import.meta as any).env.VITE_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Califica la calidad de este Lead para Hungers. Empresa: ${deal.organization}. Prioridad: ${deal.priority}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiScore: { type: Type.NUMBER },
            aiCategory: { type: Type.STRING },
            aiReasoning: { type: Type.STRING },
            aiNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["aiScore", "aiCategory", "aiReasoning", "aiNextSteps"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error qualifying lead:", error);
    throw error;
  }
};
