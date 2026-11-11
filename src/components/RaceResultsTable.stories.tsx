import type { Meta, StoryObj } from '@storybook/react-vite'
import { raceByRound } from '@/data/season'
import { RaceResultsTable } from './RaceResultsTable'

const meta = { title: 'Components/RaceResultsTable', component: RaceResultsTable } satisfies Meta<typeof RaceResultsTable>
export default meta
export const Podium: StoryObj<typeof meta> = { args: { results: raceByRound(1)!.results.slice(0, 3) } }
