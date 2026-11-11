import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardTitle } from './card'
import { Table, Td, Th } from './table'

const meta = { title: 'UI/shadcn' } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Buttons: Story = {
  render: () => (
    <div className="flex gap-3"><Button>Default</Button><Button variant="outline">Outline</Button><Button size="sm">Small</Button></div>
  ),
}
export const Cards: Story = { render: () => <Card><CardTitle>Card title</CardTitle><p>Card body</p></Card> }
export const Badges: Story = { render: () => <Badge>Sprint</Badge> }
export const Tables: Story = {
  render: () => (
    <Table><thead><tr><Th>Pos</Th><Th>Driver</Th></tr></thead><tbody><tr><Td>1</Td><Td>Lando Norris</Td></tr></tbody></Table>
  ),
}
