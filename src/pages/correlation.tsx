import Correlations from '~/components/Correlations'
import Layout from '~/layout'
import { QueryClient, QueryClientProvider } from 'react-query'
import { withPerformanceLogging } from '~/utils/perf'
import { getAllCGTokensList, maxAgeForNext } from '~/api'

const queryClient = new QueryClient()

export const getStaticProps = withPerformanceLogging('correlation', async () => {
	const coinsData = await getAllCGTokensList()
	return {
		props: {
			coinsData
		},
		revalidate: maxAgeForNext([22])
	}
})

export default function Compare({ coinsData }) {
	return (
		<QueryClientProvider client={queryClient}>
			<Layout title={`Correlations - DefiLlama`}>
				<Correlations coinsData={coinsData} />
			</Layout>
		</QueryClientProvider>
	)
}
