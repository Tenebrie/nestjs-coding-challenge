import { Injectable } from '@nestjs/common'
import * as https from 'https'
import { FlightResponseJSON, SchemaService } from './schema.service'
import { CacheService } from './cache.service'

export const FlightDataSourceURLs = {
	challengeSourceA: 'https://coding-challenge.powerus.de/flight/source1',
	challengeSourceB: 'https://coding-challenge.powerus.de/flight/source2',
}

export type FlightDataSource = keyof typeof FlightDataSourceURLs

@Injectable()
export class ApiService {
	constructor(private readonly schemaService: SchemaService, private readonly cacheService: CacheService) {}

	getFlightsFromSource(source: FlightDataSource) {
		return new Promise<{ source: FlightDataSource; data: FlightResponseJSON }>((resolve, reject) => {
			const cachedValue = this.cacheService.readCacheEntry(source)
			if (cachedValue) {
				resolve({
					source,
					data: cachedValue,
				})
				return
			}

			const url = FlightDataSourceURLs[source]

			const request = https
				.get(url, (response) => {
					let data = ''

					response.on('data', (chunk) => {
						data += chunk
					})

					response.on('end', () => {
						try {
							const parsedResponse = this.schemaService.parseFlightsResponseJson(data)
							this.cacheService.writeCacheEntry(source, parsedResponse)

							resolve({
								source,
								data: parsedResponse,
							})
						} catch (err) {
							reject('Unexpected message format')
						}
					})
				})
				.on('error', (err) => {
					reject(err.message)
				})

			// Service is slow. Reject the promise without cancelling the request.
			request.setTimeout(500, () => {
				reject('Internal timeout')
			})

			// Service is down. Destroy the request.
			request.setTimeout(5000, () => {
				request.destroy(new Error('Request timed out'))
			})
		})
	}

	async getFlightsFromMultipleSources(sources: FlightDataSource[]) {
		const results = await Promise.allSettled(sources.map((source) => this.getFlightsFromSource(source)))

		const fulfilledResults = results.filter(
			<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
				result.status === 'fulfilled'
		)

		return fulfilledResults.map((result) => result.value)
	}

	async getFlightsFromAllSources() {
		return this.getFlightsFromMultipleSources(Object.keys(FlightDataSourceURLs) as FlightDataSource[])
	}
}
