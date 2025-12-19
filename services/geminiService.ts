
import { GoogleGenAI } from "@google/genai";
import { Deal } from "../types";

export const analyzeDeal = async (deal: Deal): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un experto consultor de ventas senior para "Hungers", un CRM de alimentos y logística. 
      Analiza el siguiente trato y proporciona 3 recomendaciones rápidas para cerrarlo.
      Título: ${deal.title}
      Valor: $${deal.value}
      Estado actual: ${deal.status}
      Contacto: ${deal.contactName} de ${deal.organization}
      Prioridad: ${deal.priority}
      
      Formato de respuesta: Markdown breve con viñetas.`,
    });
    return response.text || "No se pudo generar el análisis en este momento.";
  } catch (error) {
    console.error("Error analyzing deal:", error);
    return "Error al conectar con la inteligencia artificial de Hungers.";
  }
};
