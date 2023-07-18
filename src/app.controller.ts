import { Controller, Get } from '@nestjs/common'
import { FlightsService } from './services/flights.service'

@Controller()
export class AppController {
	constructor(private readonly flightsService: FlightsService) {}

	@Get('/flights')
	async getFlights() {
		return this.flightsService.getAvailableFlights()
	}
}
