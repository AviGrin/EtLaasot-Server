import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import EventRepository from './event.repository';
import { IEvent } from './interfaces/event.interface';
import AttendeeService from '../attendee/attendee.service';
import AiService from '../ai/ai.service';
import ActivityRepository from '../activity/activity.repository'; // הוסף ל-constructor

type EventInput = Omit<IEvent, 'startDate' | 'endDate'> & {
  startDate: string | Date;
  endDate: string | Date;
};

@Injectable()
export default class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly attendeeService: AttendeeService,
    @Inject(forwardRef(() => ActivityRepository)) // <-- הוספת ההזרקה המעגלית
    private readonly aiService: AiService
  ) { }
  public async generateAndSaveSummary(eventId: string) {
    const event = await this.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    // שליפת הפעילויות מהשטח (כדי לקבל את הערות החונכים)
    const activities = await this.activityRepository.findAdminActivities({ eventId });

    if (activities.length === 0) {
      throw new BadRequestException('Cannot generate summary: No activities recorded for this event');
    }

    // הפעלת שירות ה-AI
    const aiSummary = await this.aiService.generateEventSummary(event.name, event.startDate, activities);

    // שמירה ל-DB
    await event.update({ aiSummary });
    return { success: true, summary: aiSummary };
  }
  public async createEvent(eventData: EventInput) {
    try {
      const payload = {
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      };
      const event = await this.eventRepository.create(payload);
      return event;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create event');
    }
  }

  public async updateEvent(id: string, eventData: EventInput) {
    try {
      const payload = {
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      };

      const event = await this.eventRepository.updateEvent(id, payload);

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      return event;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  public async findAllEvents(branchId?: string) {
    try {
      return await this.eventRepository.findAll(branchId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch events');
    }
  }

  public async addAttendee(userId: string, eventId: string) {
    try {
      return await this.attendeeService.addAttendee(userId, eventId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to add attendee to event',
      );
    }
  }

  public async getAllAttendeesByEvent(eventId: string) {
    try {
      return await this.attendeeService.getAllAttendeesByEvent(eventId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch attendees by event',
      );
    }
  }

  public async getUpcomingByBranch(branchId: string, limit: number) {
    try {
      return await this.eventRepository.getUpcomingByBranch(branchId, limit);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch upcoming events');
    }
  }

  public async getEventsByBranchAndDateRange(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      return await this.eventRepository.getEventsByBranchAndDateRange(
        branchId,
        startDate,
        endDate,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch events by date range',
      );
    }
  }

  public async findById(id: string) {
    try {
      return await this.eventRepository.findById(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch event');
    }
  }

  public async getParticipantsByEvent(eventId: string, actor: any) {
    return await this.attendeeService.getParticipantsByEvent(eventId, actor);
  }

  public async createManualPairing(
    eventId: string,
    mentorId: string,
    traineeId: string,
    actor: any,
  ) {
    return await this.attendeeService.createManualPairing(
      eventId,
      mentorId,
      traineeId,
      actor,
    );
  }

  public async deletePairingWithAttendees(
    eventId: string,
    pairingId: string,
    actor: any,
  ) {
    return await this.attendeeService.deletePairingWithAttendees(
      eventId,
      pairingId,
      actor,
    );
  }
}
