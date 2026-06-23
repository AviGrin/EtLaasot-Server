import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import VolunteerActivity from './entities/activity.entity';
import ActivityController from './activity.controller';
import ActivityService from './activity.service';
import ActivityRepository from './activity.repository';
import { UserModule } from '../user/user.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    SequelizeModule.forFeature([VolunteerActivity]),
    UserModule,
    forwardRef(() => EventModule), // <-- שינוי קטן כאן למניעת מעגל
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityRepository],
  exports: [ActivityService,ActivityRepository],
})
export class ActivityModule {}
