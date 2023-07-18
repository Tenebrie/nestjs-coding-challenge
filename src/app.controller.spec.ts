import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { CacheService } from './services/cache.service'
import { FlightsService } from './services/flights.service'
import { ApiService } from './services/api.service'
import { SchemaService } from './services/schema.service'
import { mockFlightSource } from './services/api.service.mock'
import { setupServer } from 'msw/node'
import { expectedEndpointResponse, responseOfSourceA, responseOfSourceB } from './app.controller.spec.data'

const server = setupServer()

describe('AppController', () => {
	beforeAll(() => server.listen())
	afterEach(() => server.resetHandlers())
	afterAll(() => server.close())

	let appController: AppController

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [FlightsService, CacheService, ApiService, SchemaService],
		}).compile()

		appController = app.get<AppController>(AppController)

		mockFlightSource({
			server,
			source: 'challengeSourceA',
			response: responseOfSourceA,
		})

		mockFlightSource({
			server,
			source: 'challengeSourceB',
			response: responseOfSourceB,
		})
	})

	describe('GET /flights', () => {
		it('should return valid information', async () => {
			expect(await appController.getFlights()).toEqual(expectedEndpointResponse)
		})
	})
})
