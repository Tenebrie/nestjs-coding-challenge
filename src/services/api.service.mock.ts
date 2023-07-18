import { SetupServer } from 'msw/lib/node'
import { FlightDataSource, FlightDataSourceURLs } from './api.service'
import { FlightResponseJSON } from './schema.service'
import { rest } from 'msw'

export const mockFlightSource = ({
	server,
	source,
	response,
	status,
	delay,
}: {
	server: SetupServer
	source: FlightDataSource
	response: FlightResponseJSON | { status: 500; message: any }
	status?: number
	delay?: number
}) => {
	let invocationCount = 0

	const handler = rest['get'](FlightDataSourceURLs[source], async (req, res, ctx) => {
		invocationCount += 1
		return res(ctx.delay(delay), ctx.status(status ?? 200), ctx.json(response))
	})
	server.use(handler)

	return {
		getInvocationCount: () => invocationCount,
	}
}
