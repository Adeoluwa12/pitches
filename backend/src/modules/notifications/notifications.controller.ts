import { Controller, Get, Patch, Param, Request, UseGuards, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.notificationsService.getForUser(req.user.userId, page);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.userId);
  }
}
