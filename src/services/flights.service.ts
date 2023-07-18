import { Injectable } from '@nestjs/common'
import { ApiService } from './api.service'
import { FlightResponseJSON } from './schema.service'

@Injectable()
export class FlightsService {
	constructor(private readonly apiService: ApiService) {}

	getFlightId(flight: FlightResponseJSON['flights'][number]) {
		return flight.slices
			.map(
				(slice) => `${slice.flight_number}/${slice.departure_date_time_utc}/${slice.arrival_date_time_utc}`
			)
			.join('-')
	}

	async getAvailableFlights() {
		const responses = await this.apiService.getFlightsFromAllSources()

		const allFlights = responses
			.flatMap((response) => response.data.flights)
			.map((flight) => ({
				...flight,
				id: this.getFlightId(flight),
			}))
		const deduplicatedFlights = [...new Map(allFlights.map((v) => [v.id, v])).values()]
		return deduplicatedFlights
	}
}
