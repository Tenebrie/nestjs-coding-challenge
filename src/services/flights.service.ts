import { Injectable } from '@nestjs/common'
import { ApiService } from './api.service'

@Injectable()
export class FlightsService {
	constructor(private readonly apiService: ApiService) {}

	async getAvailableFlights() {
		const responses = await this.apiService.getFlightsFromAllSources()

		const allFlights = responses
			.flatMap((response) => response.data.flights)
			.map((flight) => ({
				...flight,
				id: flight.slices
					.map(
						(slice) =>
							`${slice.flight_number}/${slice.departure_date_time_utc}/${slice.arrival_date_time_utc}`
					)
					.join('-'),
			}))
		const deduplicatedFlights = [...new Map(allFlights.map((v) => [v.id, v])).values()]
		return deduplicatedFlights
	}
}
