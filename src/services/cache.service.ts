import { Injectable } from '@nestjs/common'
import { FlightDataSource } from './api.service'
import { FlightResponseJSON } from './schema.service'

@Injectable()
export class CacheService {
	// Let's pretend it's Redis or something
	inMemoryCache: Partial<Record<FlightDataSource, { data: FlightResponseJSON; timestamp: number }>> = {}

	readCacheEntry(source: FlightDataSource) {
		const entry = this.inMemoryCache[source]
		if (!entry) {
			return null
		}

		const currentTime = Date.now()
		if (currentTime - entry.timestamp > 60 * 60 * 1000) {
			this.inMemoryCache[source] = undefined
			return null
		}

		return entry.data
	}

	writeCacheEntry(source: FlightDataSource, data: FlightResponseJSON) {
		this.inMemoryCache[source] = {
			data,
			timestamp: Date.now(),
		}
	}
}
