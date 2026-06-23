import { Module } from '@nestjs/common';
import AiService from './ai.service';
// אם יש לך AiController, תוכל להוסיף אותו ל-controllers
// אבל כרגע כל הלוגיקה מתבצעת דרך EventService ולכן לא חובה

@Module({
  providers: [AiService],
  exports: [AiService], // קריטי: מייצא את השירות כדי שמודולים אחרים (כמו EventModule) יוכלו להשתמש בו
})
export class AiModule {}