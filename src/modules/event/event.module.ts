import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import Event from './entities/event.entity';
import EventService from './event.service';
import EventRepository from './event.repository';
import EventController from './event.controller';
import { AttendeeModule } from '../attendee/attendee.module';
import Attendee from '../attendee/entities/attendee.entity';
import EventPairing from '../attendee/entities/event-pairing.entity';
import { AiModule } from '../ai/ai.module';
import { ActivityModule } from '../activity/activity.module'; // <-- ייבוא הקובץ

@Module({
  imports: [
    SequelizeModule.forFeature([Event, Attendee, EventPairing]),
    forwardRef(() => AttendeeModule),
    forwardRef(() => ActivityModule), // <-- השורה שהייתה חסרה!
    AiModule,
  ],
  providers: [EventService, EventRepository],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
