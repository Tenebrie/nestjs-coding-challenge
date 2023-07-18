import { Injectable } from '@nestjs/common'
import { z } from 'zod'

const flightResponseJsonSchema = z.object({
	flights: z.array(
		z.object({
			slices: z.array(
				z.object({
					origin_name: z.string(),
					destination_name: z.string(),
					departure_date_time_utc: z.string(),
					arrival_date_time_utc: z.string(),
					flight_number: z.string(),
					duration: z.number(),
				})
			),
			price: z.number(),
		})
	),
})

export type FlightResponseJSON = z.infer<typeof flightResponseJsonSchema>

@Injectable()
export class SchemaService {
	parseFlightsResponseJson(data: unknown) {
		return flightResponseJsonSchema.parse(data)
	}
}
