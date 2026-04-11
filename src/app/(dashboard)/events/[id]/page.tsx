import EventDetail from './EventDetail'

// Wrapper extracts id from params cleanly before hooks run
export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    return <EventDetail id={id} />;
}