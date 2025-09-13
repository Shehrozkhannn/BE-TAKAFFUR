import { Injectable } from '@nestjs/common';
import { InferenceClient } from '@huggingface/inference';
import fetch from 'node-fetch';

@Injectable()
export class QuoteService {
  private hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  async getAdvice(mood: string) {
    try {
      const response = await this.hf.chatCompletion({
        provider: 'nebius',
        model: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
        messages: [
          {
            role: 'user',
            content: `The user expressed: "${mood}". 
                Suggest ONE Quranic theme (patience, hope, gratitude, forgiveness, strength, mercy, guidance, justice, etc.).
                Only return the single theme word.`,
          },
        ],
      });

      const theme =
        response.choices?.[0]?.message?.content?.trim().toLowerCase() || 'patience';

      const ayahMap: Record<string, string> = {
        patience: '2:153',
        hope: '39:53',
        gratitude: '14:7',
        forgiveness: '24:22',
        strength: '3:139',
      };
      const ayahKey = ayahMap[theme] || '2:286';

      const token = await this.getAccessToken();
      console.log('Access Token:', token);

      if (!token) throw new Error('Failed to get access token');

      // Step 4: Fetch ayah with translation
      const quranRes = await fetch(
        `https://apis.quran.foundation/content/api/v4/verses/by_key/${encodeURIComponent(
          ayahKey,
        )}?translations=20&fields=text_uthmani,translations&translation_fields=text`,
        {
          headers: {
            'x-auth-token': token,
            'x-client-id': process.env.QURAN_CLIENT_ID,
            'Content-Type': 'application/json',
          },
        },
      );

      const quranData: any = await quranRes.json();

      const ayah = quranData.verse.text_uthmani;
      const translation =
        quranData.verse.translations?.[0]?.text.replace(/<[^>]*>?/gm, '') || 'Translation not found';

      return {
        mood,
        theme,
        ayah,
        translation,
        reference: ayahKey,
      };
    } catch (e) {
      console.error('Error:', e.message);
      return {
        mood,
        ayah: 'Indeed, Allah is with the patient.',
        translation: 'Surah Al-Baqarah 2:153',
        reference: '2:153',
      };
    }
  }


  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const basicAuth = Buffer.from(
      `${process.env.QURAN_CLIENT_ID}:${process.env.QURAN_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch(
      'https://oauth2.quran.foundation/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=content',
      },
    );

    const data = await response.json();

    if (!data.access_token) {
      throw new Error(`Auth failed: ${JSON.stringify(data)}`);
    }
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }
}
