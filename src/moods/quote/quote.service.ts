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
    // Step 1: Keyword safety net for sadness-related moods
    const sadnessKeywords = ["cry", "cried", "crying", "tears", "sad", "depressed", "heartbroken", "grief"];
    let theme: string | null = null;

    if (sadnessKeywords.some(k => mood.toLowerCase().includes(k))) {
      theme = "patience"; // Always map sadness/crying to patience
    }

    // Step 2: If no keyword match, ask the model
    if (!theme) {
      const response = await this.hf.chatCompletion({
        provider: 'nebius',
        model: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
        messages: [
          {
            role: 'user',
            content: `The user expressed: "${mood}". 
              From this fixed list [patience, hope, gratitude, forgiveness, strength, mercy, guidance, justice],
              pick the single theme that is most relevant. 
              If the user expresses sadness, grief, hardship, or crying, always map to "patience".
              If none are relevant, return "gratitude".
              Only return the word exactly as written in the list.
            `,
          },
        ],
      });

      theme =
        response.choices?.[0]?.message?.content?.trim().toLowerCase() || 'patience';
    }

    // Step 3: Multiple ayahs for variety
    const ayahMap: Record<string, string[]> = {
      patience: ['2:153', '2:286', '3:200','2:155','39:10','11:115','8:46'],
      hope: ['39:53', '12:87','94:5','2:286'],
      gratitude: ['14:7', '2:152','9:51','31:12','34:13','16:114'],
      forgiveness: ['24:22', '3:135','39:53','11:3','4:110','2:199','42:40'],
      strength: ['8:46','8:60','16:97','58:21','14:7','29:69','47:7'],
      mercy: ['7:156', '21:107','6:54','24:20','39:9'],
      guidance: ['1:6', '2:2','28:56','2:38','24:35'],
      justice: ['4:58', '5:8','4:135','16:90','55:7'],
    };

    const ayahs = ayahMap[theme] || ['2:286'];
    const ayahKey = ayahs[Math.floor(Math.random() * ayahs.length)]; // Pick random ayah

    const token = await this.getAccessToken();
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
      theme: 'patience',
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
