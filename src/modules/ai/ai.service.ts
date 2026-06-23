import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { getRequiredEnv } from 'src/config/env.util';
import VolunteerActivity from '../activity/entities/activity.entity';

@Injectable()
export default class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: getRequiredEnv('GEMINI_API_KEY') });
  }

  public async generateEventSummary(
    eventName: string,
    eventDate: string | Date,
    activities: VolunteerActivity[]
  ): Promise<string> {
    if (!activities || activities.length === 0) {
      throw new Error('At least one activity is required to generate a summary');
    }

    const systemInstruction = `
    אתה עוזר אדמיניסטרטיבי חכם ויעיל עבור רכז סניף של תנועת נוער לילדים עם צרכים מיוחדים.
    תפקידך הוא לנתח את דיווחי והערות החונכים (המתנדבים) מתוך הפעילות האחרונה, ולספק סיכום מנהלים מזוקק, קצר ומבני בעברית.

    הקפד על המבנה הבא בתוצאה (השתמש ב-Markdown):
    
    ### 1. סקירה כללית
    סיכום קצר של 2-3 שורות על אופי הפעילות הכללי והאם רוב הצוותים חוו פעילות מוצלחת.

    ### 2. אירועים חריגים ומקרי קצה (קריטי למעקב)
    תחת סעיף זה, ציין בנפרד (בנקודות) כל חונך או חניך שחוו קושי מיוחד, בעיות התנהגות, אלימות, בכי, קושי בוויסות חושי, או טענות ותלונות ספציפיות שעלו מהשטח.
    חובה להדגיש את שמותיהם המלאים של החונך והחניך הרלוונטיים (לדוגמה: **ישראל ישראלי ויוסי כהן**). אם אין אירועים חריגים, כתוב במפורש "לא דווחו אירועים חריגים".

    ### 3. נקודות לשימור והצלחות מיוחדות
    ציין בקצר חניכים שהפגינו התקדמות יוצאת דופן, שיתוף פעולה מפתיע או חיבור יוצא מן הכלל עם החונך.

    דגשים חשובים:
    - שמור על טון מקצועי, ענייני וממוקד אקשן.
    - אל תמציא פרטים או נתונים שלא קיימים בדיווחים הגולמיים שסופקו לך.
    `;

    const formattedActivities = activities
      .map(act => `חונך: ${act.volunteer?.name || 'לא ידוע'} | חניך: ${act.trainee?.name || 'לא ידוע'} | סטטוס: ${act.status} | הערות: ${act.notes || 'אין הערות'}`)
      .join('\n\n');

    const formattedDate = eventDate instanceof Date ? eventDate.toLocaleDateString('he-IL') : eventDate;

    const userPrompt = `
    שם האירוע: ${eventName}
    תאריך: ${formattedDate}
    
    להלן דיווחי החונכים מהשטח:
    ${formattedActivities}
    `;

    try {
      this.logger.debug(`Sending ${activities.length} activities to Gemini 2.5 Flash...`);
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        }
      });

      if (!response?.text) {
        throw new Error('AI Engine failed to return a valid text response');
      }

      return response.text;
    } catch (error: any) {
      this.logger.error(`AI Generation failed: ${error.message}`, error.stack);
      // מחזירים שגיאה עמומה למשתמש, בדיוק כפי שהגדרת למען אבטחה
      throw new InternalServerErrorException('An internal server error occurred while processing the AI summary');
    }
  }
}