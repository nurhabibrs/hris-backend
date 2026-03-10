import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationModule } from '../notifications/notifications.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationModule,
    RabbitMQModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
