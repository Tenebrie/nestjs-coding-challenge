import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { FlightsService } from './services/flights.service'
import { ApiService } from './services/api.service'
import { CacheService } from './services/cache.service'
import { SchemaService } from './services/schema.service'

@Module({
	imports: [],
	controllers: [AppController],
	providers: [FlightsService, ApiService, CacheService, SchemaService],
})
export class AppModule {}
