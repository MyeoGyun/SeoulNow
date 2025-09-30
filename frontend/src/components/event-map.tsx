'use client';

import { useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import L, { LatLngTuple } from 'leaflet';

import type { EventLocation } from '@/lib/api-client';
import districtsGeoJson from '@/data/seoul-districts.geo.json';
import 'leaflet/dist/leaflet.css';

const SEOUL_CENTER: LatLngTuple = [37.5665, 126.978];

const TILE_LAYER_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const TILE_LAYER_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
  '&copy; OpenStreetMap contributors &copy; CARTO';

type DistrictFeature = Feature<Polygon | MultiPolygon, { name: string; [key: string]: unknown }>;

const districts = districtsGeoJson as FeatureCollection<
  Polygon | MultiPolygon,
  { name: string }
>;

interface EventMapProps {
  events: EventLocation[];
  preservedParams: Record<string, string[]>;
  searchValue?: string | null;
  selectedFee?: string | null;
  selectedDistrict?: string | null;
}

export function EventMap({
  events,
  preservedParams,
  searchValue,
  selectedFee,
  selectedDistrict,
}: EventMapProps) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((event) => {
      const key = event.guname?.trim();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [events]);

  const maxCount = useMemo(() => {
    if (counts.size === 0) return 0;
    return Math.max(...counts.values());
  }, [counts]);

  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const getFillOpacity = useCallback(
    (feature: DistrictFeature | undefined) => {
      const name = feature?.properties?.name ?? '';
      const count = counts.get(name) ?? 0;
      if (maxCount === 0) return 0.15;
      const ratio = count / maxCount;
      return 0.15 + ratio * 0.4;
    },
    [counts, maxCount],
  );

  const styleFeature = useCallback(
    (feature?: Feature) => {
      const districtFeature = feature as DistrictFeature | undefined;
      const isSelected = districtFeature?.properties?.name === selectedDistrict;

      if (!districtFeature) {
        return {
          weight: 1,
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.15,
        } satisfies L.PathOptions;
      }

      return {
        weight: isSelected ? 2.4 : 1.1,
        color: isSelected ? '#1d4ed8' : '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: isSelected
          ? Math.min(getFillOpacity(districtFeature) + 0.25, 0.85)
          : getFillOpacity(districtFeature),
        dashArray: isSelected ? undefined : '3',
      } satisfies L.PathOptions;
    },
    [getFillOpacity, selectedDistrict],
  );

  const applyDistrictFilter = useCallback(
    (district: string | null) => {
      const params = new URLSearchParams();

      Object.entries(preservedParams).forEach(([key, values]) => {
        values.forEach((value) => params.append(key, value));
      });

      const trimmedSearch = searchValue?.trim();
      if (trimmedSearch) {
        params.set('search', trimmedSearch);
      }

      if (selectedFee) {
        params.set('is_free', selectedFee);
      }

      if (district) {
        params.set('guname', district);
      }

      const query = params.toString();
      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, preservedParams, router, searchValue, selectedFee],
  );

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const districtFeature = feature as DistrictFeature;
      const name = districtFeature.properties?.name ?? '알 수 없음';
      const count = counts.get(name) ?? 0;

      layer.bindTooltip(`${name} · ${count.toLocaleString()}건`, {
        direction: 'center',
        permanent: true,
        className: 'district-label',
        opacity: 0.9,
      });

      layer.on('mouseover', () => {
        (layer as L.Path).setStyle({
          weight: 2,
          fillOpacity: Math.min(getFillOpacity(districtFeature) + 0.2, 0.85),
        });
      });

      layer.on('mouseout', () => {
        geoJsonRef.current?.resetStyle(layer as L.Path);
      });

      layer.on('click', () => {
        const normalized = name.trim();
        const next = normalized === selectedDistrict ? null : normalized;
        applyDistrictFilter(next);
      });
    },
    [applyDistrictFilter, counts, getFillOpacity, selectedDistrict],
  );

  return (
    <div className="h-[420px] w-full">
      <MapContainer
        center={SEOUL_CENTER}
        zoom={11}
        className="h-full w-full rounded-3xl border border-border shadow-inner"
        scrollWheelZoom={false}
      >
        <TileLayer url={TILE_LAYER_URL} attribution={TILE_LAYER_ATTRIBUTION} />
        <GeoJSON
          key={events.length}
          data={districts}
          style={styleFeature}
          onEachFeature={onEachFeature}
          ref={geoJsonRef}
        />
      </MapContainer>
    </div>
  );
}
