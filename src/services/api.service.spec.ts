import { Test, TestingModule } from '@nestjs/testing'
import { ApiService } from './api.service'
import { setupServer } from 'msw/node'
import { CacheService } from './cache.service'
import { mockFlightSource } from './api.service.mock'
import { SchemaService } from './schema.service'

const server = setupServer()

describe('ApiService', () => {
	beforeAll(() => server.listen())
	afterEach(() => server.resetHandlers())
	afterAll(() => server.close())

	let apiService: ApiService

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			providers: [ApiService, CacheService, SchemaService],
		}).compile()

		apiService = app.get(ApiService)
	})

	describe('with flight services responding as normally', () => {
		it('returns API response', async () => {
			const response = {
				flights: [
					{
						slices: [
							{
								origin_name: 'Schonefeld',
								destination_name: 'Stansted',
								departure_date_time_utc: '2019-08-08T04:30:00.000Z',
								arrival_date_time_utc: '2019-08-08T06:25:00.000Z',
								flight_number: '144',
								duration: 115,
							},
							{
								origin_name: 'Stansted',
								destination_name: 'Schonefeld',
								departure_date_time_utc: '2019-08-10T05:35:00.000Z',
								arrival_date_time_utc: '2019-08-10T07:35:00.000Z',
								flight_number: '8542',
								duration: 120,
							},
						],
						price: 129,
					},
				],
			}
			mockFlightSource({
				server,
				source: 'challengeSourceA',
				response: response,
			})

			const result = await apiService.getFlightsFromSource('challengeSourceA')

			expect(result).toEqual({
				source: 'challengeSourceA',
				data: response,
			})
		})

		it('uses cached value on second request', async () => {
			const response = {
				flights: [
					{
						slices: [],
						price: 129,
					},
				],
			}
			const { getInvocationCount } = mockFlightSource({
				server,
				source: 'challengeSourceA',
				response: response,
			})

			await apiService.getFlightsFromSource('challengeSourceA')
			const resultB = await apiService.getFlightsFromSource('challengeSourceA')

			expect(resultB).toEqual({
				source: 'challengeSourceA',
				data: response,
			})
			expect(getInvocationCount()).toEqual(1)
		})
	})

	describe('with flight services returning invalid responses', () => {
		it('rejects the promise', async () => {
			mockFlightSource({
				server,
				source: 'challengeSourceA',
				status: 500,
				response: {
					status: 500,
					message: 'Internal Server Error',
				},
			})

			expect(apiService.getFlightsFromSource('challengeSourceA')).rejects.toEqual('Unexpected message format')
		})
	})

	describe('with fake timers', () => {
		beforeAll(() => {
			jest.useFakeTimers()
		})
		afterAll(() => {
			jest.useRealTimers()
		})

		it('discards outdated cache', async () => {
			const response = {
				flights: [
					{
						slices: [],
						price: 129,
					},
				],
			}
			const { getInvocationCount } = mockFlightSource({
				server,
				source: 'challengeSourceA',
				response: response,
			})

			await apiService.getFlightsFromSource('challengeSourceA')

			jest.advanceTimersByTime(60 * 60 * 1000 + 1)

			const resultB = await apiService.getFlightsFromSource('challengeSourceA')

			expect(resultB).toEqual({
				source: 'challengeSourceA',
				data: response,
			})
			expect(getInvocationCount()).toEqual(2)
		})
	})
})
