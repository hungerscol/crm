
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Deal, LeadQualification } from "../types";

/**
 * Uses Gemini 3 Pro to analyze a deal and provide professional sales strategy insights.
 * Follows Google GenAI SDK best practices for initialization using process.env.API_KEY.
 */
export const analyzeDeal = async (deal: Deal): Promise<string> => {
  try {
    // Correctly using process.env.API_KEY as the exclusive source for the API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded to Pro for complex strategic reasoning.
      contents: `Eres el Director de Estrategia de Ventas Senior en "Hungers". Tu especialidad es el cierre táctico de tratos complejos en el sector logístico y de alimentos.
      
      Analiza este trato y proporciona una guía de CIERRE PROFESIONAL:
      - Título: ${deal.title}
      - Valor: ${deal.currency} ${deal.value}
      - Cliente: ${deal.contactName} de ${deal.organization}
      - Estado actual: ${deal.status}
      - Actividades recientes: ${deal.activities.slice(0, 3).map(a => a.content).join('; ')}
      
      Responde con: Gatillo Psicológico, Estrategia de Valor, Manejo de Objeciones y NEXT STEP IMPERATIVO.`,
    });
    
    // Accessing .text property directly as per latest SDK guidelines.
    return response.text || "La IA no pudo generar una estrategia en este momento.";
  } catch (error) {
    console.error("Error analyzing deal:", error);
    return "Error al conectar con la inteligencia estratégica de Hungers.";
  }
};

/**
 * Qualifies a lead using structured JSON output from Gemini Flash.
 */
export const qualifyLead = async (deal: Deal): Promise<Partial<LeadQualification>> => {
  try {
    // Initializing with the required process.env.API_KEY parameter.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
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

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Error qualifying lead:", error);
    throw error;
  }
};
