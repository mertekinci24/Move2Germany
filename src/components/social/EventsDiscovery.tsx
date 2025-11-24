import { useState, useEffect } from 'react';
import { getEvents, type Event } from '../../lib/events';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, ExternalLink, Ticket } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';

export function EventsDiscovery() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadEvents() {
            if (!user) return;
            try {
                const data = await getEvents(user.primaryCityId || 'berlin');
                setEvents(data);
            } catch (error) {
                console.error('Failed to load events:', error);
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        }
        loadEvents();
    }, [user]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No upcoming events</h3>
                <p className="text-gray-500 mt-1">Check back later for social gatherings and workshops.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                            <div className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">
                                {event.source_type}
                            </div>
                            <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
                        </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col space-y-3">
                        <div className="flex items-start text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy • h:mm a')}</span>
                        </div>

                        <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{event.venue_name || 'Online'}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                            <Ticket className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{event.is_free ? 'Free' : `${event.price_min || ''} - ${event.price_max || ''} ${event.currency}`}</span>
                        </div>

                        {event.description && (
                            <p className="text-sm text-gray-500 line-clamp-3 flex-1">
                                {event.description}
                            </p>
                        )}

                        <div className="pt-4 mt-auto">
                            {event.source_url ? (
                                <a
                                    href={event.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-full px-4 py-2 bg-gray-50 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm border border-gray-200 hover:border-blue-200"
                                >
                                    View Details <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            ) : (
                                <button disabled className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-md text-sm font-medium cursor-not-allowed">
                                    Details Unavailable
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
