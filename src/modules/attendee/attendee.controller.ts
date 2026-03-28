import { Body, Controller, Delete, Param, Put, Req, UseGuards } from '@nestjs/common';
import AttendeeService from './attendee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attendee')
@UseGuards(JwtAuthGuard)
export default class AttendeeController {
  constructor(private readonly attendeeService: AttendeeService) { }

  @Put(':attendeeId/rsvp')
  public async updateRsvp(
    @Param('attendeeId') attendeeId: string,
    @Body() body: { rsvpStatus: string },
  ) {
    return await this.attendeeService.updateRsvp(attendeeId, body.rsvpStatus);
  }

  @Put(':attendeeId/checkin')
  public async checkIn(
    @Param('attendeeId') attendeeId: string,
    @Req() req: any,
  ) {
    return await this.attendeeService.checkIn(attendeeId, req.user.userId);
  }

  @Delete(':attendeeId')
  public async deleteAttendee(@Param('attendeeId') attendeeId: string) {
    return await this.attendeeService.deleteAttendee(attendeeId);
  }
}
