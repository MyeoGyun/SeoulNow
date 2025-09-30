'use client';

import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L, { LatLngTuple } from 'leaflet';
import type { EventLocation } from '@/lib/api-client';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  shadowSize: [46, 46]
});

L.Marker.prototype.options.icon = defaultIcon;

const SEOUL_CENTER: LatLngTuple = [37.5665, 126.978];

interface EventMapProps {
  events: EventLocation[];
}

export function EventMap({ events }: EventMapProps) {
  const markers = useMemo(() => events.filter((event) => event.lat != null && event.lot != null), [events]);

  return (
    <div className="h-[420px] w-full">
      <MapContainer
        center={SEOUL_CENTER}
        zoom={11}
        className="h-full w-full rounded-3xl border border-border shadow-inner"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {markers.map((event) => (
          <Marker key={event.id} position={[event.lat!, event.lot!] as LatLngTuple}>
            <Popup>
              <div className="space-y-1 text-sm">
                <strong className="block text-base text-foreground">{event.title}</strong>
                {event.guname && <span className="block text-muted-foreground">{event.guname}</span>}
                {event.start_date && (
                  <span className="block text-muted-foreground">
                    {new Date(event.start_date).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {event.is_free && <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{event.is_free}</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
