/**
 * translate.ts
 * 
 * Google Translate API service and language constants.
 */

export type SupportedLanguage = 'en' | 'ar';

export const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
    en: 'en',
    ar: 'ar',
};

export class GoogleTranslateService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
        if (!text || !text.trim()) return text;

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    target: targetLanguage,
                    source: sourceLanguage,
                    format: 'text',
                }),
            });

            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.data && data.data.translations && data.data.translations.length > 0) {
                return data.data.translations[0].translatedText;
            }
            return text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    async translateBatch(texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<string[]> {
        if (!texts || texts.length === 0) return [];

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: texts,
                    target: targetLanguage,
                    source: sourceLanguage,
                    format: 'text',
                }),
            });

            if (!response.ok) {
                throw new Error(`Batch translation request failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.data && data.data.translations) {
                return data.data.translations.map((t: any) => t.translatedText || '');
            }
            return texts;
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts;
        }
    }

    async getSupportedLanguages(): Promise<string[]> {
        try {
            const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch supported languages');
            }
            const data = await response.json();
            if (data.data && data.data.languages) {
                return data.data.languages.map((l: any) => l.language);
            }
            return [];
        } catch (error) {
            console.error('Error fetching supported languages:', error);
            return [];
        }
    }
}
