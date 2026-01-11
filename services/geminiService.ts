import { GoogleGenAI, Type } from "@google/genai";
import { Deal, LeadQualification } from "../types";

export const analyzeDeal = async (deal: Deal): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres el Director de Estrategia de Ventas Senior en "Hungers". Tu especialidad es el cierre táctico de tratos complejos en el sector logístico y de alimentos (Horeca/Retail).
      
      Analiza este trato y proporciona una guía de CIERRE AGRESIVA Y PROFESIONAL:
      - Título: ${deal.title}
      - Valor: ${deal.currency} ${deal.value}
      - Cliente: ${deal.contactName} de ${deal.organization}
      - Estado actual: ${deal.status}
      - Actividades: ${deal.activities.map(a => a.content).join('; ')}
      
      Tu respuesta debe estructurarse así:
      1. **Gatillo Psicológico**: Identifica qué sesgo usar (escasez, autoridad, reciprocidad) para este cliente específico.
      2. **Estrategia de Valor**: Cómo justificar el ROI de Hungers frente a la competencia.
      3. **Manejo de Objeciones**: Respuesta lista para la duda más probable (precio o tiempos).
      4. **NEXT STEP IMPERATIVO**: La acción exacta que el vendedor debe ejecutar HOY para forzar el cierre.
      
      Usa un tono experto, motivador y directo. Formato Markdown.`,
    });
    return response.text || "La IA no pudo generar una estrategia en este momento.";
  } catch (error) {
    console.error("Error analyzing deal:", error);
    return "Error al conectar con la inteligencia estratégica de Hungers.";
  }
};

export const qualifyLead = async (deal: Deal): Promise<Partial<LeadQualification>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Califica la calidad de este Lead para la industria logística de Hungers. Empresa: ${deal.organization}. Prioridad: ${deal.priority}.`,
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