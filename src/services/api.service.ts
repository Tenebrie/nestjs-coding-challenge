import { Injectable } from '@nestjs/common'
import { FlightResponseJSON, SchemaService } from './schema.service'
import { CacheService } from './cache.service'
import axios from 'axios'

export const FlightDataSourceURLs = {
	challengeSourceA: 'https://coding-challenge.powerus.de/flight/source1',
	challengeSourceB: 'https://coding-challenge.powerus.de/flight/source2',
}

export type FlightDataSource = keyof typeof FlightDataSourceURLs

@Injectable()
export class ApiService {
	constructor(private readonly schemaService: SchemaService, private readonly cacheService: CacheService) {}

	getFlightsFromSource(source: FlightDataSource) {
		return new Promise<{ source: FlightDataSource; data: FlightResponseJSON }>(async (resolve, reject) => {
			const cachedValue = this.cacheService.readCacheEntry(source)
			if (cachedValue) {
				resolve({
					source,
					data: cachedValue,
				})
				return
			}

			const url = FlightDataSourceURLs[source]

			// Service is slow. Reject the promise without cancelling the request.
			// Keep the result for the cache regardless.
			const timeout = setTimeout(() => {
				reject('Internal timeout')
			}, 500)

			try {
				const response = await axios.get(url)
				clearTimeout(timeout)
				const parsedResponse = this.schemaService.parseFlightsResponseJson(response.data)
				this.cacheService.writeCacheEntry(source, parsedResponse)
				resolve({
					source,
					data: parsedResponse,
				})
			} catch (err) {
				console.error(`Request to source ${source} has failed`)
				reject(err)
			}
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
