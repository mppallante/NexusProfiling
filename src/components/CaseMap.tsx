import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { CaseDetail } from '../types/domain';

interface CaseMapProps {
  detail: CaseDetail;
}

export function CaseMap({ detail }: CaseMapProps) {
  const points = detail.entities
    .filter((entity) => entity.type === 'location' && typeof entity.metadata.lat === 'number' && typeof entity.metadata.lng === 'number')
    .map((entity) => ({ entity, lat: Number(entity.metadata.lat), lng: Number(entity.metadata.lng) }));

  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : [-14.235, -51.9253];

  return (
    <section className="panel map-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Mapa</span>
          <h2>Locais vinculados</h2>
        </div>
      </div>
      <MapContainer center={center} zoom={points.length ? 11 : 4} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker key={point.entity.id} position={[point.lat, point.lng]}>
            <Popup>{point.entity.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
