import { lazy, Suspense, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '~/layout'
import { LazyChart } from '~/components/LazyChart'
import {
	useYieldChartData,
	useYieldChartLendBorrow,
	useConfigPool,
	useYieldConfigData
} from '~/containers/Yields/queries/client'
import { calculateLoopAPY } from '~/containers/Yields/queries/index'
import { formattedNum } from '~/utils'

const BarChart = lazy(() => import('~/components/ECharts/BarChart'))

const AreaChart = lazy(() => import('~/components/ECharts/AreaChart'))

const PageView = () => {
	const { query } = useRouter()

	const tokens = query.strat?.split('_')

	const lendToken = tokens?.length ? tokens[0] : ''
	const borrowToken = tokens?.length ? tokens[1] : ''
	const farmToken = tokens?.length ? tokens[2] : ''

	const { data: lendHistory, isLoading: fetchingLendData } = useYieldChartData(lendToken)
	const { data: borrowHistory } = useYieldChartLendBorrow(borrowToken)
	const { data: farmHistory } = useYieldChartData(farmToken)

	const { data: configData } = useConfigPool(tokens?.length ? tokens.join(',') : '')

	const project = configData?.data?.find((p) => p.config_id === lendToken)?.project

	const { data: config } = useYieldConfigData(project ?? '')
	const lendProjectCategory = config?.category

	const parseTimestamp = (timestamp) => {
		return new Date(timestamp.split('T')[0]).getTime() / 1000
	}

	const {
		finalChart = [],
		barChartDataSupply = [],
		barChartDataBorrow = [],
		barChartDataFarm = [],
		lendApy,
		borrowApy,
		farmApy,
		finalAPY,
		ltv,
		farmTVL,
		borrowAvailable
	} = useMemo(() => {
		if (!lendHistory || !borrowHistory || !farmHistory || !configData || !lendProjectCategory) return {}

		const lendData = lendHistory?.data?.map((t) => ({
			...t,
			timestamp: parseTimestamp(t.timestamp)
		}))
		const borrowData = borrowHistory?.data?.map((t) => ({
			...t,
			timestamp: parseTimestamp(t.timestamp)
		}))
		const farmData = farmHistory?.data?.map((t) => ({
			...t,
			timestamp: parseTimestamp(t.timestamp)
		}))

		const uniqueDates = [
			...new Set(
				lendData
					.map((d) => d.timestamp)
					.concat(borrowData.map((d) => d.timestamp))
					.concat(farmData.map((d) => d.timestamp))
			)
		]

		let merged = []
		uniqueDates.forEach((d) => {
			merged.push({
				timestamp: d,
				lendData: lendData.find((i) => i.timestamp === d),
				borrowData: borrowData.find((i) => i.timestamp === d),
				farmData: farmData.find((i) => i.timestamp === d)
			})
		})
		merged = merged.filter((t) => !Object.values(t).includes(undefined))
		// filter merged to length where all 3 components (lend/borrow/farm values) are not null
		merged = merged.filter(
			(t) => t.lendData.apy !== null && t.borrowData.apyBaseBorrow !== null && t.farmData.apy !== null
		)

		const configs = configData?.data || []

		const ltv = configs?.find((p) => p.config_id === lendToken)?.ltv || 0

		merged = merged.map((t) => ({
			...t,
			strategyAPY:
				t.lendData.apy + (-t.borrowData.apyBaseBorrow + t.borrowData.apyRewardBorrow) * ltv + t.farmData.apy * ltv,
			loopAPY: calculateLoopAPY([{ ...t?.borrowData, apyBaseBorrow: -t?.borrowData?.apyBaseBorrow, ltv }], 10)[0]
				?.loopApy
		}))

		const strategyData = merged.map((t) => [t.timestamp, t?.strategyAPY?.toFixed(2)]).filter((t) => t[1])
		const loopData = merged.map((t) => [t.timestamp, t?.loopAPY?.toFixed(2)]).filter((t) => t[1])

		// make sure this is the most recent value
		const latestValues = merged?.slice(-1)[0] ?? []
		const farmTVL = latestValues?.farmData?.tvlUsd ?? 0
		const borrowAvailable = latestValues?.borrowData?.totalSupplyUsd - latestValues?.borrowData?.totalBorrowUsd ?? 0

		const lendApy = latestValues?.lendData?.apy ?? 0

		const borrowApyBase = latestValues?.borrowData?.apyBaseBorrow ?? 0
		const borrowApyReward = latestValues?.borrowData?.apyRewardBorrow ?? 0
		const borrowApy = -borrowApyBase + borrowApyReward

		const farmApy = latestValues?.farmData?.apy ?? 0

		const strategyAPY = latestValues?.strategyAPY ?? 0
		const loopAPY = latestValues?.loopAPY ?? 0

		const finalAPY = lendToken === borrowToken && lendProjectCategory !== 'CDP' ? loopAPY : strategyAPY
		const finalChart = lendToken === borrowToken && lendProjectCategory !== 'CDP' ? loopData : strategyData

		const barChartDataSupply = merged?.length
			? merged.map((item) => ({
					date: item.lendData.timestamp,
					Base: item.lendData?.apyBase?.toFixed(2),
					Reward: item.lendData?.apyReward?.toFixed(2)
			  }))
			: []

		const barChartDataBorrow = merged?.length
			? merged.map((item) => ({
					date: item.borrowData.timestamp,
					Base: -item.borrowData?.apyBaseBorrow?.toFixed(2),
					Reward: item.borrowData?.apyRewardBorrow?.toFixed(2)
			  }))
			: []

		const barChartDataFarm = merged?.length
			? merged.map((item) => ({
					date: item.farmData.timestamp,
					Base: item.farmData?.apyBase?.toFixed(2) ?? item.farmData.apy?.toFixed(2),
					Reward: item.farmData?.apyReward?.toFixed(2)
			  }))
			: []

		return {
			finalChart,
			lendApy,
			borrowApy,
			farmApy,
			finalAPY,
			ltv,
			barChartDataSupply,
			barChartDataBorrow,
			barChartDataFarm,
			farmTVL,
			borrowAvailable
		}
	}, [lendHistory, borrowHistory, farmHistory, configData, lendToken, borrowToken, lendProjectCategory])

	return (
		<>
			<div className="grid grid-cols-2 relative isolate xl:grid-cols-3 gap-2">
				<div className="bg-(--cards-bg) border border-(--cards-border) rounded-md flex flex-col gap-6 p-5 col-span-2 w-full xl:col-span-1 overflow-x-auto">
					<h1 className="text-xl">APY Breakdown:</h1>
					<table className="w-full text-base border-collapse">
						<tbody>
							<tr className="border-b border-(--divider)">
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left pb-1">Strategy APY:</th>
								<td className="font-jetbrains text-right pb-1">{finalAPY?.toFixed(2)}%</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left pt-1">Supply APY:</th>
								<td className="font-jetbrains text-right">{lendApy?.toFixed(2)}%</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left">Borrow APY:</th>
								<td className="font-jetbrains text-right">{borrowApy?.toFixed(2)}%</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left">Farm APY:</th>
								<td className="font-jetbrains text-right">{farmApy?.toFixed(2)}%</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left">Max LTV:</th>
								<td className="font-jetbrains text-right">{ltv?.toFixed(2) * 100}%</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left">
									Available Borrow Liquidity:
								</th>
								<td className="font-jetbrains text-right">${formattedNum(borrowAvailable)}</td>
							</tr>

							<tr>
								<th className="text-[#545757] dark:text-[#cccccc] font-normal text-left">Farm TVL:</th>
								<td className="font-jetbrains text-right">{formattedNum(farmTVL, true)}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<LazyChart className="bg-(--cards-bg) border border-(--cards-border) rounded-md pt-3 col-span-2 min-h-[480px]">
					<AreaChart title="Strategy APY" chartData={finalChart} color={backgroundColor} valueSymbol={'%'} />
				</LazyChart>
			</div>

			<div className="flex flex-col gap-4 bg-(--cards-bg) border border-(--cards-border) rounded-md p-3">
				<h3>Steps</h3>
				<p className="flex items-center gap-2">
					<span>1.</span>
					Lend {configData?.data.find((c) => c.config_id === lendToken)?.symbol} as collateral on{' '}
					{configData?.data.find((c) => c.config_id === lendToken)?.project} which earns a Supply APY of{' '}
					{lendApy?.toFixed(2)}%.
				</p>
				<p className="flex items-center gap-2">
					<span>2.</span>
					Borrow{' '}
					{lendProjectCategory !== 'CDP'
						? configData?.data.find((c) => c.config_id === borrowToken)?.symbol
						: configData?.data.find((c) => c.config_id === borrowToken)?.mintedCoin}{' '}
					against your {configData?.data.find((c) => c.config_id === lendToken)?.symbol} collateral with a max LTV of{' '}
					{(ltv * 100).toFixed()}% and a borrow APY of {borrowApy?.toFixed(2)}% (
					{borrowApy > 0 ? 'You get paid by borrowing' : 'The interest you need to pay'}).
				</p>

				{configData?.data.find((c) => c.config_id === borrowToken)?.symbol !==
					configData?.data.find((c) => c.config_id === farmToken)?.symbol && lendProjectCategory !== 'CDP' ? (
					<p className="flex items-center gap-2">
						<span>3.</span>
						Swap borrowed {configData?.data.find((c) => c.config_id === borrowToken)?.symbol} for{' '}
						{configData?.data.find((c) => c.config_id === farmToken)?.symbol}
					</p>
				) : null}

				<p className="flex items-center gap-2">
					{configData?.data.find((c) => c.config_id === borrowToken)?.symbol !==
					configData?.data.find((c) => c.config_id === farmToken)?.symbol ? (
						<span>4.</span>
					) : (
						<span>3.</span>
					)}
					Farm with {configData?.data.find((c) => c.config_id === farmToken)?.symbol} on{' '}
					{configData?.data.find((c) => c.config_id === farmToken)?.project} which earns {farmApy?.toFixed(2)}%.
				</p>

				{configData?.data.find((c) => c.config_id === lendToken)?.symbol ===
				configData?.data.find((c) => c.config_id === borrowToken)?.symbol ? (
					// loop strategies
					<p className="flex items-center gap-2">
						Strategy APY = Recursively lend and borrow {configData?.data.find((c) => c.config_id === lendToken)?.symbol}{' '}
						up to n-times (Strategy APY is calculated assuming 10 loops)
					</p>
				) : (
					// non loop strategies
					<p className="flex items-center gap-2">
						Strategy APY = {lendApy?.toFixed(2)}% {borrowApy > 0 ? `+ ${borrowApy?.toFixed(2)}` : borrowApy?.toFixed(2)}
						% * {ltv?.toFixed(2)} + {farmApy?.toFixed(2)}% * {ltv?.toFixed(2)} = {finalAPY?.toFixed(2)}%
					</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-1 rounded-md bg-(--cards-bg)">
				{fetchingLendData ? (
					<p className="flex items-center justify-center text-center h-[400px] col-span-full">Loading...</p>
				) : (
					lendHistory?.data?.length && (
						<>
							{barChartDataSupply?.length ? (
								<LazyChart className="relative col-span-full min-h-[360px] flex flex-col xl:col-span-1 xl:[&:last-child:nth-child(2n-1)]:col-span-full">
									<Suspense fallback={<></>}>
										<BarChart
											title="Supply APY"
											chartData={barChartDataSupply}
											stacks={barChartStacks}
											stackColors={barChartColors}
											valueSymbol={'%'}
										/>
									</Suspense>
								</LazyChart>
							) : null}

							{barChartDataBorrow?.length ? (
								<LazyChart className="relative col-span-full min-h-[360px] flex flex-col xl:col-span-1 xl:[&:last-child:nth-child(2n-1)]:col-span-full">
									<Suspense fallback={<></>}>
										<BarChart
											title="Borrow APY"
											chartData={barChartDataBorrow}
											stacks={barChartStacks}
											stackColors={barChartColors}
											valueSymbol={'%'}
										/>
									</Suspense>
								</LazyChart>
							) : null}

							{barChartDataFarm?.length ? (
								<LazyChart className="relative col-span-full min-h-[360px] flex flex-col xl:col-span-1 xl:[&:last-child:nth-child(2n-1)]:col-span-full">
									<Suspense fallback={<></>}>
										<BarChart
											title="Farm APY"
											chartData={barChartDataFarm}
											stacks={barChartStacks}
											stackColors={barChartColors}
											valueSymbol={'%'}
										/>
									</Suspense>
								</LazyChart>
							) : null}
						</>
					)
				)}
			</div>
		</>
	)
}

const backgroundColor = '#4f8fea'

const barChartColors = {
	Base: backgroundColor,
	Reward: '#E59421'
}

const barChartStacks = {
	Base: 'a',
	Reward: 'a'
}

export default function YieldPoolPage(props) {
	return (
		<Layout title={`Yield Chart - DefiLlama`} defaultSEO>
			<PageView {...props} />
		</Layout>
	)
}
