import WallClient from './WallClient'

export default async function WallPage({
    params,
}: {
    params: Promise<{ eventId: string }>
}) {
    const { eventId } = await params
    return <WallClient eventId={eventId} />
}