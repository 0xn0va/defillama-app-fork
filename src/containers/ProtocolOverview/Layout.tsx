import * as React from 'react'
import Layout from '~/layout'
import { ProtocolsChainsSearch } from '~/components/Search/ProtocolsChains'
import { slug, tokenIconUrl } from '~/utils'
import { BasicLink } from '~/components/Link'
import { IProtocolPageMetrics } from './types'
import * as Ariakit from '@ariakit/react'
import { TokenLogo } from '~/components/TokenLogo'
import { defaultProtocolPageStyles } from './Chart/constants'

export function ProtocolOverviewLayout({
	children,
	isCEX,
	name,
	category,
	otherProtocols,
	toggleOptions,
	metrics,
	tab,
	warningBanners
}: {
	children: React.ReactNode
	isCEX?: boolean
	name: string
	category: string
	otherProtocols?: Array<string>
	toggleOptions?: Array<{
		name: string
		key: string
	}>
	metrics: IProtocolPageMetrics
	tab?:
		| 'information'
		| 'assets'
		| 'tvl'
		| 'stablecoins'
		| 'bridges'
		| 'treasury'
		| 'unlocks'
		| 'yields'
		| 'fees'
		| 'dexs'
		| 'perps'
		| 'dex-aggregators'
		| 'perps-aggregators'
		| 'bridge-aggregators'
		| 'options'
		| 'governance'
		| 'forks'
	warningBanners?: Array<{
		message: string
		until?: number | string // unix timestamp or "forever" or date string  in 'YYYY-MM-DD' format, 'forever' if the field is not set
		level: 'low' | 'alert' | 'rug'
	}>
}) {
	return (
		<Layout title={`${name} - DefiLlama`} style={defaultProtocolPageStyles}>
			<ProtocolsChainsSearch options={toggleOptions} />

			{(category === 'Uncollateralized Lending' || category === 'RWA Lending') && (
				<p className="relative p-2 text-xs text-black dark:text-white text-center rounded-md bg-(--btn-bg) border border-(--bg-color)">
					Borrowed coins are not included into TVL by default, to include them toggle Borrows. For more info on this
					click{' '}
					<a
						href="https://github.com/DefiLlama/DefiLlama-Adapters/discussions/6163"
						target="_blank"
						rel="noreferrer noopener"
						className="underline"
					>
						here
					</a>
					.
				</p>
			)}

			{warningBanners?.map((banner) => (
				<p
					className={`relative p-2 text-xs text-black dark:text-white text-center rounded-md border ${
						banner.level === 'rug'
							? 'bg-(--pct-red)/20 border-(--pct-red)'
							: banner.level === 'alert'
							? 'bg-(--pct-yellow)/20 border-(--pct-yellow)'
							: 'bg-(--btn-bg) border-(--bg-color)'
					}`}
					key={`${banner.message}-${banner.level}-${name}`}
				>
					{banner.message}
				</p>
			))}

			<div className="flex flex-col gap-2 isolate">
				<div className="w-full flex overflow-x-auto text-xs font-medium">
					{otherProtocols?.length > 1 && (
						<Ariakit.MenuProvider>
							<Ariakit.MenuButton className="mr-4 flex shrink-0 items-center justify-between gap-2 py-1 px-2 font-normal rounded-md cursor-pointer bg-white dark:bg-[#181A1C] hover:bg-(--link-hover-bg) focus-visible:bg-(--link-hover-bg) border border-(--cards-border)">
								<TokenLogo logo={tokenIconUrl(name)} size={16} />
								<span className="whitespace-nowrap">{name === otherProtocols[0] ? `${name} (Combined)` : name}</span>
								<Ariakit.MenuButtonArrow />
							</Ariakit.MenuButton>
							<Ariakit.Menu
								unmountOnHide
								gutter={8}
								wrapperProps={{
									className: 'max-sm:fixed! max-sm:bottom-0! max-sm:top-[unset]! max-sm:transform-none! max-sm:w-full!'
								}}
								className="text-sm font-medium flex flex-col bg-(--bg1) rounded-md max-sm:rounded-b-none z-10 overflow-auto overscroll-contain min-w-[180px] max-h-[60vh] border border-[hsl(204,20%,88%)] dark:border-[hsl(204,3%,32%)] max-sm:drawer sm:max-w-md"
								portal
							>
								{otherProtocols.map((value, i) => {
									return (
										<Ariakit.MenuItem
											key={'navigate to ' + `/protocol/${slug(value)}`}
											render={<BasicLink href={`/protocol/${slug(value)}`} />}
											data-active={name === value}
											className={`group flex items-center gap-2 py-2 relative ${
												i === 0 ? 'px-3' : 'ml-[22px] pr-3'
											} shrink-0 hover:bg-(--primary1-hover) focus-visible:bg-(--primary1-hover) data-active-item:bg-(--primary1-hover) data-[active=true]:bg-(--primary1-hover) cursor-pointer first-of-type:rounded-t-md whitespace-nowrap overflow-hidden text-ellipsis`}
										>
											{i !== 0 && (
												<>
													<span className="w-[2px] h-full group-last:h-[50%] absolute top-0 bottom-0 left-0 block bg-(--form-control-border)" />
													<span className="w-3 h-[2px] bg-(--form-control-border) -mr-2" />
												</>
											)}
											<TokenLogo logo={tokenIconUrl(value)} size={24} />
											{i === 0 ? (
												<span className="flex flex-col">
													<span>{`${value} (Combined)`}</span>
													<span className="text-[10px] text-[#666] dark:text-[#919296]">Aggregated view</span>
												</span>
											) : (
												<span>{value}</span>
											)}
										</Ariakit.MenuItem>
									)
								})}
							</Ariakit.Menu>
						</Ariakit.MenuProvider>
					)}

					{isCEX ? (
						<BasicLink
							href={`/cex/${slug(name)}`}
							data-active={!tab || tab === 'information'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Information
						</BasicLink>
					) : (
						<BasicLink
							href={`/protocol/${slug(name)}`}
							data-active={!tab || tab === 'information'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Information
						</BasicLink>
					)}
					{metrics.tvlTab ? (
						isCEX ? (
							<BasicLink
								href={`/cex/assets/${slug(name)}`}
								data-active={tab === 'assets'}
								className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
							>
								Assets
							</BasicLink>
						) : (
							<BasicLink
								href={`/protocol/tvl/${slug(name)}`}
								data-active={tab === 'tvl'}
								className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
							>
								TVL
							</BasicLink>
						)
					) : null}
					{metrics.stablecoins && (
						<BasicLink
							href={`/protocol/stablecoins/${slug(name)}`}
							data-active={tab === 'stablecoins'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Stablecoin Info
						</BasicLink>
					)}
					{metrics.bridge && (
						<BasicLink
							href={`/protocol/bridges/${slug(name)}`}
							data-active={tab === 'bridges'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Bridge Info
						</BasicLink>
					)}
					{metrics.treasury && (
						<BasicLink
							href={`/protocol/treasury/${slug(name)}`}
							data-active={tab === 'treasury'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Treasury
						</BasicLink>
					)}
					{metrics.unlocks && (
						<BasicLink
							href={`/protocol/unlocks/${slug(name)}`}
							data-active={tab === 'unlocks'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Unlocks
						</BasicLink>
					)}
					{metrics.yields && (
						<BasicLink
							href={`/protocol/yields/${slug(name)}`}
							data-active={tab === 'yields'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Yields
						</BasicLink>
					)}
					{metrics.fees && (
						<BasicLink
							href={`/protocol/fees/${slug(name)}`}
							data-active={tab === 'fees'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Fees and Revenue
						</BasicLink>
					)}
					{metrics.dexs && (
						<BasicLink
							href={`/protocol/dexs/${slug(name)}`}
							data-active={tab === 'dexs'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							DEX Volume
						</BasicLink>
					)}
					{metrics.perps && (
						<BasicLink
							href={`/protocol/perps/${slug(name)}`}
							data-active={tab === 'perps'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Perp Volume
						</BasicLink>
					)}
					{metrics.dexAggregators && (
						<BasicLink
							href={`/protocol/dex-aggregators/${slug(name)}`}
							data-active={tab === 'dex-aggregators'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Aggregator Volume
						</BasicLink>
					)}
					{metrics.perpsAggregators && (
						<BasicLink
							href={`/protocol/perps-aggregators/${slug(name)}`}
							data-active={tab === 'perps-aggregators'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Perp Aggregator Volume
						</BasicLink>
					)}
					{metrics.bridgeAggregators && (
						<BasicLink
							href={`/protocol/bridge-aggregators/${slug(name)}`}
							data-active={tab === 'bridge-aggregators'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Bridge Aggregator Volume
						</BasicLink>
					)}
					{metrics.options && (
						<BasicLink
							href={`/protocol/options/${slug(name)}`}
							data-active={tab === 'options'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Options Volume
						</BasicLink>
					)}
					{metrics.governance && (
						<BasicLink
							href={`/protocol/governance/${slug(name)}`}
							data-active={tab === 'governance'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Governance
						</BasicLink>
					)}
					{metrics.forks && (
						<BasicLink
							href={`/protocol/forks/${slug(name)}`}
							data-active={tab === 'forks'}
							className="shrink-0 py-1 px-4 whitespace-nowrap border-b-2 border-(--form-control-border) data-[active=true]:border-(--primary-color) hover:bg-(--btn-hover-bg) focus-visible:bg-(--btn-hover-bg)"
						>
							Forks
						</BasicLink>
					)}
				</div>
				{children}
			</div>
		</Layout>
	)
}
